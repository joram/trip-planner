# Generated by Django 2.1.5 on 2019-03-12 20:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('routes', '0004_routemetadata_bounds'),
    ]

    operations = [
        migrations.AddField(
            model_name='routemetadata',
            name='source',
            field=models.CharField(choices=[('summitpost', 'Summitpost'), ('trailpeak', 'Trailpeak')], default='trailpeak', max_length=16),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='routemetadata',
            name='source_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
