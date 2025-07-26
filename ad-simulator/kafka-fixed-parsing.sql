USE ad_analytics;

-- Fixed materialized view with correct JSON parsing
CREATE MATERIALIZED VIEW impressions_mv TO impressions_local AS
WITH JSONExtract(raw_message, 'String') as clean_json
SELECT
    toUUID(JSONExtractString(clean_json, 'adId')) as ad_id,
    toUUID(JSONExtractString(clean_json, 'campaignId')) as campaign_id,
    toUUID(JSONExtractString(clean_json, 'creativeId')) as creative_id,
    parseDateTimeBestEffort(JSONExtractString(clean_json, 'timestamp')) as timestamp,
    JSONExtractString(clean_json, 'deviceType') as device_type,
    JSONExtractString(clean_json, 'location') as location,
    JSONExtractString(clean_json, 'browser') as browser,
    JSONExtractString(clean_json, 'gender') as gender,
    JSONExtractUInt(clean_json, 'age') as age
FROM impressions_kafka
WHERE clean_json != '' AND clean_json != 'null';