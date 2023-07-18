const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const logger = Core.Logger('main', { level: 'info' })
const { getAEMAccessToken, getAssetMetadata } = require('../aem-file-common/common-utils')
const IngestorCreator = require('../aem-file-ingestors/ingestor-creator')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Inside aem-file-export/event-handler.js main');
    logger.info(stringParameters(params));

    if (Object.keys(params).length > 0) {
      const event = params.event;
      // const contentPath = event['activitystreams:object']['xdmAsset:path'];
      const contentPath = '/content/dam/ihar-test/image/image.png';

      let responseBody;
      if (contentPath.startsWith("/content/dam")) {
        logger.info("asset content path:" + contentPath);
        const assetMetadata = await getAssetMetadata(params.aemAuthorHost, params.aemServiceCredentials, contentPath);

        const aemServiceCredentials = params.aemServiceCredentials;
        this.aemtoken = await getAEMAccessToken(JSON.parse(aemServiceCredentials));

        const aemAssetUrl = params.aemAuthorHost + contentPath;
        logger.info(`downloading asset from "${aemAssetUrl}" at ${new Date().toISOString()}`);
        // const aemStream = await fetch(aemAssetUrl, {
        //   method: 'GET',
        //   headers: {
        //     'Authorization': 'Bearer ' + this.aemtoken
        //   }
        // });
        // logger.info('stream: ' + aemStream);
        // if (assetMetadata['exportDestination'] && assetMetadata['exportImmediately'] === 'yes') {
        //   //export the asset immediately based on the exportDestination
        //   logger.info(`got exportDestination: ${assetMetadata['exportDestination']} and set to params`);
        //   params.fileDestination = assetMetadata['exportDestination'];
          const FileIngestor = IngestorCreator.create(params);
          await FileIngestor.init();

          logger.info(`exporting asset: "${contentPath}"`);
          responseBody = await FileIngestor.ingestAemAsset(contentPath);
        // }
        logger.info("metadata:" + assetMetadata['dc:title']);

        const response = {
          statusCode: 200,
          headers:
            { 'Content-type': 'application/json' },
          body: JSON.stringify(responseBody)
        }

        return response;
      }
    }

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
