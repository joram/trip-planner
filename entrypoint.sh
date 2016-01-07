#!/bin/bash

django-admin.py makemigrations
django-admin.py migrate
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | django-admin.py shell
yes y | django-admin.py rebuild_index
django-admin.py runserver 0.0.0.0:80