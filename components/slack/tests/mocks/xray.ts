import { vi, afterAll, afterEach } from 'vitest';

// Mock state that can be used for assertions
const mockState = {
  currentSegment: null,
  segments: [],
  subsegments: [],
  annotations: {},
  metadata: {},
  errors: [],
};

// Create mock functions that we'll expose for assertions
const mockCaptureAWSv3Client = vi.fn((client) => client);
const mockCaptureAWSv3ClientWithXRay = vi.fn((client) => client);
const mockCaptureHTTPsGlobal = vi.fn();
const mockCaptureHTTPs = vi.fn();
const mockCapturePromise = vi.fn((promise) => promise);
const mockCaptureAsyncFunc = vi.fn((func) => {
  // Wrap the function to maintain the same behavior
  return (...args) => {
    try {
      const result = func(...args);
      return result;
    } catch (error) {
      // Record error in the mock state
      mockState.errors.push(error);
      throw error;
    }
  };
});

const mockSetContextMissingStrategy = vi.fn();

// Create a subsegment factory helper that tests can use
const createMockSubsegment = (name = 'test-subsegment', parent = null) => {
  const subsegmentId = `subsegment-${mockState.subsegments.length + 1}`;
  const subsegment = {
    id: subsegmentId,
    name,
    parent,
    traced: true,
    addError: vi.fn((error) => {
      mockState.errors.push(error);
    }),
    addAnnotation: vi.fn((key, value) => {
      mockState.annotations[key] = value;
    }),
    addMetadata: vi.fn((key, value, namespace = 'default') => {
      if (!mockState.metadata[namespace]) {
        mockState.metadata[namespace] = {};
      }
      mockState.metadata[namespace][key] = value;
    }),
    close: vi.fn(() => {
      subsegment.closed = true;
      return subsegment;
    }),
    addSubsegment: vi.fn((childSubsegment) => {
      childSubsegment.parent = subsegment;
      mockState.subsegments.push(childSubsegment);
      return childSubsegment;
    }),
    addNewSubsegment: vi.fn((name) => {
      const newSubsegment = createMockSubsegment(name, subsegment);
      subsegment.addSubsegment(newSubsegment);
      return newSubsegment;
    }),
    isClosed: vi.fn(() => subsegment.closed || false),
    flush: vi.fn(),
    closed: false,
    http: {
      request: {},
      response: {}
    },
    aws: {},
    sql: {},
    setNamespace: vi.fn((namespace) => {
      subsegment.namespace = namespace;
      return subsegment;
    }),
    setThrottle: vi.fn((throttle) => {
      subsegment.throttle = throttle;
      return subsegment;
    }),
    setError: vi.fn((error) => {
      subsegment.error = error;
      mockState.errors.push(error);
      return subsegment;
    }),
    setFault: vi.fn((fault) => {
      subsegment.fault = fault;
      return subsegment;
    }),
  };
  
  mockState.subsegments.push(subsegment);
  return subsegment;
};

// Create a segment factory helper that tests can use
const createMockSegment = (name = 'test-segment') => {
  const segmentId = `segment-${mockState.segments.length + 1}`;
  const segment = {
    id: segmentId,
    name,
    addError: vi.fn((error) => {
      mockState.errors.push(error);
    }),
    addAnnotation: vi.fn((key, value) => {
      mockState.annotations[key] = value;
    }),
    addMetadata: vi.fn((key, value, namespace = 'default') => {
      if (!mockState.metadata[namespace]) {
        mockState.metadata[namespace] = {};
      }
      mockState.metadata[namespace][key] = value;
    }),
    close: vi.fn(() => {
      segment.closed = true;
      return segment;
    }),
    flush: vi.fn(),
    traced: true,
    closed: false,
    isClosed: vi.fn(() => segment.closed || false),
    subsegments: [],
    addSubsegment: vi.fn((subsegment) => {
      subsegment.parent = segment;
      segment.subsegments.push(subsegment);
      mockState.subsegments.push(subsegment);
      return subsegment;
    }),
    addNewSubsegment: vi.fn((name) => {
      const subsegment = createMockSubsegment(name, segment);
      segment.addSubsegment(subsegment);
      return subsegment;
    }),
    removeSubsegment: vi.fn((subsegment) => {
      const index = segment.subsegments.indexOf(subsegment);
      if (index !== -1) {
        segment.subsegments.splice(index, 1);
      }
    }),
    setUser: vi.fn((user) => {
      segment.user = user;
      return segment;
    }),
    setSDKData: vi.fn((data) => {
      segment.sdk = data;
      return segment;
    }),
    setTraceId: vi.fn((traceId) => {
      segment.trace_id = traceId;
      return segment;
    }),
  };
  
  mockState.segments.push(segment);
  mockState.currentSegment = segment;
  return segment;
};

const mockGetSegment = vi.fn(() => {
  if (!mockState.currentSegment) {
    mockState.currentSegment = createMockSegment();
  }
  return mockState.currentSegment;
});

const mockGetNamespace = vi.fn(() => ({
  createContext: vi.fn(),
  run: vi.fn((context, fn) => fn()),
}));

const mockSetSegment = vi.fn((segment) => {
  mockState.currentSegment = segment;
});

const mockSetLogger = vi.fn();

// Helper functions to simplify testing
const helpers = {
  // Create and set a new segment
  createAndSetSegment: (name) => {
    const segment = createMockSegment(name);
    mockSetSegment(segment);
    return segment;
  },
  
  // Create a new subsegment within the current segment
  createSubsegment: (name) => {
    const currentSegment = mockGetSegment();
    return currentSegment.addNewSubsegment(name);
  },
  
  // Get all subsegments
  getSubsegments: () => [...mockState.subsegments],
  
  // Get current annotations
  getAnnotations: () => ({ ...mockState.annotations }),
  
  // Get current metadata
  getMetadata: (namespace = 'default') => {
    return mockState.metadata[namespace] || {};
  },
  
  // Get all recorded errors
  getErrors: () => [...mockState.errors],
  
  // Reset mock state
  resetState: () => {
    mockState.currentSegment = null;
    mockState.segments = [];
    mockState.subsegments = [];
    mockState.annotations = {};
    mockState.metadata = {};
    mockState.errors = [];
  }
};

// Setup the mock for aws-xray-sdk-core directly
vi.mock('aws-xray-sdk-core', () => {
  return {
    captureAWSv3Client: mockCaptureAWSv3Client,
    captureAWSv3ClientWithXRay: mockCaptureAWSv3ClientWithXRay,
    captureHTTPsGlobal: mockCaptureHTTPsGlobal,
    captureHTTPs: mockCaptureHTTPs,
    capturePromise: mockCapturePromise,
    captureAsyncFunc: mockCaptureAsyncFunc,
    setContextMissingStrategy: mockSetContextMissingStrategy,
    getSegment: mockGetSegment,
    getNamespace: mockGetNamespace,
    setSegment: mockSetSegment,
    setLogger: mockSetLogger,
    Segment: vi.fn((name) => createMockSegment(name)),
    Subsegment: vi.fn((name, parent) => createMockSubsegment(name, parent)),
    SegmentUtils: {
      resolveSegment: vi.fn(() => mockGetSegment()),
      setOrigin: vi.fn(),
      setPluginData: vi.fn(),
      getOrigin: vi.fn(() => 'AWS::Lambda::Function'),
    },
    middleware: {
      enableManualMode: vi.fn(),
      processHeaders: vi.fn(),
      setDefaultName: vi.fn(),
    },
  };
});

// Reset all mocks after each test
afterEach(() => {
  mockCaptureAWSv3Client.mockClear();
  mockCaptureAWSv3ClientWithXRay.mockClear();
  mockCaptureHTTPsGlobal.mockClear();
  mockCaptureHTTPs.mockClear();
  mockCapturePromise.mockClear();
  mockCaptureAsyncFunc.mockClear();
  mockSetContextMissingStrategy.mockClear();
  mockGetSegment.mockClear();
  mockGetNamespace.mockClear();
  mockSetSegment.mockClear();
  mockSetLogger.mockClear();
  
  // Reset the helper state
  helpers.resetState();
});

// Restore all mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Export the mocks so tests can make assertions on them
export {
  mockCaptureAWSv3Client,
  mockCaptureAWSv3ClientWithXRay,
  mockCaptureHTTPsGlobal,
  mockCaptureHTTPs,
  mockCapturePromise,
  mockCaptureAsyncFunc,
  mockSetContextMissingStrategy,
  mockGetSegment,
  mockGetNamespace,
  mockSetSegment,
  mockSetLogger,
  createMockSegment,
  createMockSubsegment,
  helpers,
};