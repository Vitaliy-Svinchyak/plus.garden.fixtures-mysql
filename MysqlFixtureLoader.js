const Sequelize = require('sequelize')
const MysqlFixtureLoader = function (Garden, config, logger) {

    const fs = require('fs')
    const dbUri = config.get('fixtures-mysql:uri')
    const sequelize_fixtures = require('sequelize-fixtures')
    const sequelize = new Sequelize(dbUri, {logging: false})
    const paths = config.get('fixtures-mysql:fixtures')
    let modelsPath = config.get('fixtures-mysql:models')
    const models = {}

    function isAbsolute (path) {
        return /^\//.test(path)
    }

    function loadModels () {
        if (!isAbsolute(modelsPath)) {
            modelsPath = config.get('root_dir') + '/' + modelsPath
        }

        fs.readdirSync(modelsPath).forEach(function (file) {
            const nameParts = file.split('/')
            const name = nameParts[(nameParts.length - 1)].split('.')[0]
            models[name] = sequelize.import(modelsPath + '/' + file)
        })
    }

    async function loadPath (path) {
        if (!isAbsolute(path)) {
            path = config.get('root_dir') + '/' + path
        }

        logger.info('fixtures: ' + path)

        loadModels()

        await sequelize.sync({force: true})
        logger.info('Mysql models synchronisation successfully!')

        await sequelize_fixtures.loadFile(path + '/*.json', models, {log: function () {}})

        logger.info('success')
    }

    this.load = async function () {

        logger.info('Loading fixtures: ' + dbUri)

        if (paths instanceof Object) {
            for (const key in paths) {
                const path = paths[key]
                await loadPath(path)
            }
        } else {
            await loadPath(paths)
        }
    }

    this.drop = async function () {
        logger.info('Dropping fixtures: ' + dbUri)

        loadModels()

        await sequelize.drop({force: true})

        logger.info('success')
    }

}

module.exports = MysqlFixtureLoader

module.exports.$inject = ['Garden', 'config', 'Logger']
module.exports.$tags = ['garden.js', 'fixtures', 'loader']
