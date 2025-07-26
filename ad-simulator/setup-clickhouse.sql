-- Create database
CREATE DATABASE IF NOT EXISTS ad_analytics;
USE ad_analytics;

-- Main impressions table (MergeTree for analytics)
CREATE TABLE IF NOT EXISTS impressions_local (
    ad_id UUID,
    campaign_id UUID,
    creative_id UUID,
    timestamp DateTime64(3),
    device_type LowCardinality(String),
    location LowCardinality(String),
    browser LowCardinality(String),
    gender LowCardinality(String),
    age UInt8,
    partition_date Date MATERIALIZED toDate(timestamp),
    ingestion_time DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY partition_date
ORDER BY (campaign_id, timestamp, ad_id)
SETTINGS index_granularity = 8192;

-- Kafka consumer table
CREATE TABLE IF NOT EXISTS impressions_kafka (
    raw_message String
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'pkc-rgm37.us-west-2.aws.confluent.cloud:9092',
    kafka_topic_list = 'impressions',
    kafka_group_name = 'clickhouse_impressions_consumer',
    kafka_format = 'JSONAsString',
    kafka_num_consumers = 1,
    kafka_security_protocol = 'SASL_SSL',
    kafka_sasl_mechanism = 'PLAIN',
    kafka_sasl_username = 'VKXGGV3XZEGC3KVT',
    kafka_sasl_password = 'RSghMCy/V++wWlWc2XTc/7hoY7KAP2t7Lh8tglZt6IFwg2/Ly1k7jnjWkgbwrp+6';

-- Materialized view to transform and insert data
CREATE MATERIALIZED VIEW IF NOT EXISTS impressions_mv TO impressions_local AS
WITH JSONExtractString(JSONExtractString(raw_message, 'value'), 'data') as impression_data
SELECT
    toUUID(JSONExtractString(impression_data, 'adId')) as ad_id,
    toUUID(JSONExtractString(impression_data, 'campaignId')) as campaign_id,
    toUUID(JSONExtractString(impression_data, 'creativeId')) as creative_id,
    parseDateTimeBestEffort(JSONExtractString(impression_data, 'timestamp')) as timestamp,
    JSONExtractString(impression_data, 'deviceType') as device_type,
    JSONExtractString(impression_data, 'location') as location,
    JSONExtractString(impression_data, 'browser') as browser,
    JSONExtractString(impression_data, 'gender') as gender,
    JSONExtractUInt(impression_data, 'age') as age
FROM impressions_kafka
WHERE JSONHas(impression_data, 'adId');

-- Create some useful views for analytics
CREATE VIEW IF NOT EXISTS daily_impressions AS
SELECT 
    toDate(timestamp) as date,
    device_type,
    location,
    browser,
    gender,
    count() as impressions,
    uniq(ad_id) as unique_ads,
    uniq(campaign_id) as unique_campaigns
FROM impressions_local
GROUP BY date, device_type, location, browser, gender;

CREATE VIEW IF NOT EXISTS hourly_stats AS
SELECT 
    toStartOfHour(timestamp) as hour,
    count() as impressions,
    uniq(ad_id) as unique_ads,
    uniq(campaign_id) as unique_campaigns,
    avg(age) as avg_age
FROM impressions_local
GROUP BY hour
ORDER BY hour DESC;