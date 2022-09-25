import chalk from 'chalk'

export default class Log {
    static Ok(message)    { console.log(`[${chalk.green("OK")}] ${chalk.whiteBright(message)}`); }
    static Info(message)  { console.log(`[${chalk.cyan("INFO")}] ${chalk.whiteBright(message)}`); }
    static Warn(message)  { console.log(`[${chalk.yellow("WARN")}] ${chalk.whiteBright(message)}`); }
    static Error(message) { console.log(`[${chalk.redBright("ERROR")}] ${chalk.whiteBright(message)}`); }
}