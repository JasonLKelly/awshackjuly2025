USE ad_analytics;

-- Kafka consumer table with RawBLOB format to handle nested JSON
CREATE TABLE impressions_kafka (
    raw_message String
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'pkc-rgm37.us-west-2.aws.confluent.cloud:9092',
    kafka_topic_list = 'impressions',
    kafka_group_name = 'clickhouse_impressions_consumer_v2',
    kafka_format = 'RawBLOB',
    kafka_num_consumers = 1,
    kafka_security_protocol = 'SASL_SSL',
    kafka_sasl_mechanism = 'PLAIN',
    kafka_sasl_username = 'VKXGGV3XZEGC3KVT',
    kafka_sasl_password = 'RSJzi+fh7wEV1s8uwSvGNho8NnFw+1H8txwotUyTtdHVgWeT199WPi7i1z8Zx7dj';

-- Materialized view to parse nested JSON structure from Confluent Cloud
CREATE MATERIALIZED VIEW impressions_mv TO impressions_local AS
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
WHERE impression_data != '';