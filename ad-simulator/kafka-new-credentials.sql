USE ad_analytics;

-- Kafka consumer with new credentials
CREATE TABLE impressions_kafka (
    raw_message String
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'pkc-rgm37.us-west-2.aws.confluent.cloud:9092',
    kafka_topic_list = 'impressions',
    kafka_group_name = 'clickhouse_new_credentials',
    kafka_format = 'RawBLOB',
    kafka_num_consumers = 1,
    kafka_security_protocol = 'SASL_SSL',
    kafka_sasl_mechanism = 'PLAIN',
    kafka_sasl_username = '${CONFLUENT_API_KEY}',
    kafka_sasl_password = '${CONFLUENT_API_SECRET}';

-- Materialized view to process messages
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