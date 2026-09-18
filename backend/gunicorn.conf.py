import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = 1
worker_class = "eventlet"
worker_connections = 1000
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
