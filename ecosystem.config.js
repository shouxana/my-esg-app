module.exports = {
  apps: [
    {
      name: "my-esg-app",
      script: "./node_modules/next/dist/bin/next", // Directly call Next.js binary
      args: "start -p 3000 -H 0.0.0.0",
      cwd: "C:/Users/milos/ESG APP/my-esg-app", // Correct working directory
      interpreter: "node", // Use Node.js to execute the script
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
      },
    },
  ],
};
