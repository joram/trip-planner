# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2018-10-18 04:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trips', '0002_auto_20180531_0230'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plan',
            name='packing_list_pub_id',
            field=models.CharField(max_length=32, null=True),
        ),
        migrations.AlterField(
            model_name='plan',
            name='route_pub_id',
            field=models.CharField(max_length=32, null=True),
        ),
    ]