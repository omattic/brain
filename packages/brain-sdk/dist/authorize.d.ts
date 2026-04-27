export interface OpenAIComponentEvent {
    type: string;
    action?: string;
    toolCallId?: string;
}
export interface BrainContext {
    userId?: string;
    channelId?: string;
    teamId?: string;
}
export declare function isAuthorized(payload: {
    event: OpenAIComponentEvent;
    context: BrainContext;
}, componentName: string, question: string): Promise<any>;
