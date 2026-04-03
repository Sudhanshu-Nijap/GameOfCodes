import os
from celery import Celery

celery_app = Celery(
    "onion_scraper",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["tasks"]
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Time
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,         # 5 min hard limit per task
    task_soft_time_limit=240,    # 4 min soft limit (raises SoftTimeLimitExceeded)

    # Reliability
    broker_connection_retry_on_startup=True,   # silences CPendingDeprecationWarning

    # Windows Compatibility Fix
    worker_pool="solo" if os.name == 'nt' else "prefork",
    worker_concurrency=1 if os.name == 'nt' else 4,
    worker_prefetch_multiplier=1,              # don't prefetch; fair distribution
)
