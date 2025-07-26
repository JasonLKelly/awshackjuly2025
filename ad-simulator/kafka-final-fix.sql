USE ad_analytics;

-- Final working materialized view without UUID conversion issues
CREATE MATERIALIZED VIEW impressions_mv TO impressions_local AS
WITH JSONExtract(raw_message, 'String') as clean_json
SELECT
    reinterpretAsUUID(substring(concat(JSONExtractString(clean_json, 'adId'), '00000000000000000000000000000000'), 1, 32)) as ad_id,
    reinterpretAsUUID(substring(concat(JSONExtractString(clean_json, 'campaignId'), '00000000000000000000000000000000'), 1, 32)) as campaign_id,
    reinterpretAsUUID(substring(concat(JSONExtractString(clean_json, 'creativeId'), '00000000000000000000000000000000'), 1, 32)) as creative_id,
    parseDateTimeBestEffort(JSONExtractString(clean_json, 'timestamp')) as timestamp,
    JSONExtractString(clean_json, 'deviceType') as device_type,
    JSONExtractString(clean_json, 'location') as location,
    JSONExtractString(clean_json, 'browser') as browser,
    JSONExtractString(clean_json, 'gender') as gender,
    JSONExtractUInt(clean_json, 'age') as age
FROM impressions_kafka
WHERE clean_json != '' AND clean_json != 'null' AND JSONExtractString(clean_json, 'adId') != '';