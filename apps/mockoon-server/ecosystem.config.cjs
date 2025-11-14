module.exports = {
  apps: [
    {
      name: "mockoon",
      cwd: __dirname,
      exec_mode: "fork",
      interpreter: "none", // Critical: execute the mockoon-cli binary directly, not through Node.
      script: "./node_modules/.bin/mockoon-cli",
      args: [
        "start",
        "--data", "./environment.json",
        "--port", "4005",
        "-r",                     // auto-repair
        "--disable-log-to-file"
      ],
      watch: ["./environment.json"],
      ignore_watch: ["node_modules", ".git"],
      watch_delay: 1000,
      autorestart: true,
      max_restarts: 50,
      restart_delay: 500,
      env: { FORCE_COLOR: "1" }
    }
  ]
};
