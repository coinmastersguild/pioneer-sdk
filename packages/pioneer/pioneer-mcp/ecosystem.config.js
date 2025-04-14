module.exports = {
  apps: [
    {
      name: 'pioneer-mcp-build',
      script: 'npm',
      args: 'run build',
      watch: false,
      autorestart: false,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'pioneer-mcp-server',
      script: 'dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pioneer-mcp-error.log',
      out_file: 'logs/pioneer-mcp-output.log',
      merge_logs: true,
      log_type: 'json'
    }
  ]
}; 