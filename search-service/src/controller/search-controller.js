const logger = require("../utils/logger");
const Search = require("../model/Search");


const searchPost = async (req, res) => { 
    logger.info('search endpoint called');
    try {
    
        const { query } = req.query;
        const results = await Search.find(
            {
                $text: {
                    $search: query,
                    $caseSensitive: false,
                }
            },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } }).limit(10);
        logger.info(`Search results for query "${query}": ${JSON.stringify(results)}`);
        res.json(results)
    } catch (error) {
        logger.error("Error in search endpoint",error);
        return res.status(500).json({ message: 'Internal Server Error' });

    } 
}

module.exports = { searchPost };