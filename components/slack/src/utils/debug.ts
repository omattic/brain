import chalk from 'chalk';

type debugData = {
  scope: string,
  timestamp: number,
  params: any[]
}

let debugMemory = { logs: [] as debugData[] }

export function initDebug() {
  debugMemory.logs = []
}

export function flushDebug() {
  for (let log of debugMemory.logs) {
    console.log(new Date(log.timestamp).toUTCString(), chalk.blue(log.scope), ...log.params);
  }
}

export function debug(scope: string, color?: any) {
  return function (...messages: any): any {
    if (process.env.NODE_ENV !== 'prod') {
      console.log((chalk[color] || chalk.blue)(scope), ...messages);
    } else {
      debugMemory.logs.push({ scope, timestamp: Date.now(), params: messages })
    }
  }
}

export default debug
export { chalk }