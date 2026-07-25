module.exports = {
  apps: [
    {
      name: "reca-operator",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 3050,
        PM2_SERVE_SPA: "true",
        NODE_ENV: "production"
      }
    }
  ]
};
