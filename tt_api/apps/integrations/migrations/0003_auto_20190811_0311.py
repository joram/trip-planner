# Generated by Django 2.2.3 on 2019-08-11 03:11

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0002_auto_20190801_1911'),
    ]

    operations = [
        migrations.AddField(
            model_name='stravaaccount',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2019, 8, 11, 3, 11, 4, 875985)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='stravaaccount',
            name='refresh_token',
            field=models.CharField(default='', max_length=256),
            preserve_default=False,
        ),
    ]
