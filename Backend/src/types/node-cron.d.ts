declare module 'node-cron' {
  const cron: { schedule: (expression: string, fn: () => void | Promise<void>) => void };
  export default cron;
}
