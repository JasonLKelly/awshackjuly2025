USE ad_analytics;

-- Recreate impressions table with String IDs instead of UUIDs
CREATE TABLE impressions_local (
    ad_id String,
    campaign_id String,
    creative_id String,
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

-- Simple working materialized view with String IDs
CREATE MATERIALIZED VIEW impressions_mv TO impressions_local AS
WITH JSONExtract(raw_message, 'String') as clean_json
SELECT
    JSONExtractString(clean_json, 'adId') as ad_id,
    JSONExtractString(clean_json, 'campaignId') as campaign_id,
    JSONExtractString(clean_json, 'creativeId') as creative_id,
    parseDateTimeBestEffort(JSONExtractString(clean_json, 'timestamp')) as timestamp,
    JSONExtractString(clean_json, 'deviceType') as device_type,
    JSONExtractString(clean_json, 'location') as location,
    JSONExtractString(clean_json, 'browser') as browser,
    JSONExtractString(clean_json, 'gender') as gender,
    JSONExtractUInt(clean_json, 'age') as age
FROM impressions_kafka
WHERE clean_json != '' AND clean_json != 'null' AND JSONExtractString(clean_json, 'adId') != '';