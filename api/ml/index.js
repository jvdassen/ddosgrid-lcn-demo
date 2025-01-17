const { Router } = require('express')
const router = Router()
const { protect } = require('../auth/index')
const path = require('path')
const fs = require('fs')
const classification = require('./classification')
const persistedAnalyses =  require('../analysis/persistence')

const analysisBaseDir = path.resolve(__dirname, '../data/public/analysis/')
const analysesDB = path.resolve(__dirname, '../data/anyleses.db')
var analyses = new persistedAnalyses(analysesDB)

const { algorithms, attackTypes } = require('./values')

router.get('/algorithms', protect, getAllAlgorithms)
router.get('/attacktypes', protect, getAllAttackTypes)
router.get('/modelstats', protect, getModelDataStats)
router.get('/modeleval/:id', protect, getModelEvaluation)

router.post('/:id/addtomodel', protect, addToModel)
router.post('/:id/removefrommodel', protect, removeFromModel)
router.post('/deletemodel', protect, deleteModel)
router.post('/:id/classify', protect, startClassification)

async function getAllAlgorithms(req, res) {
  return res.status(200).send(algorithms)
}

async function getAllAttackTypes(req, res) {
  return res.status(200).send(attackTypes)
}

async function addToModel (req, res) {
  var id = req.params.id
  if (!id) {
    return res.status(404).send('ID not supplied')
  }
  var filePath = path.resolve(analysisBaseDir, req.user._id, id, `${id}.pcap-ML-features.csv`)
  try {
    fs.statSync(filePath)
  } catch (e) {
    return res.status(404).send('ID unknown')
  }
  var analysis = await analyses.getAnalysis(id, req.user._id)
  if(!analysis) {
    return res.status(404).send('File was found but no corresponding database entry. Check upload?')
  }
  var analysisRequestedByUploader = req.user._id === analysis.uploader
  if(!analysisRequestedByUploader) {
    return res.status(403).send('Unauthorized to start analysis on a dataset that was uploaded with different account')
  }

  var status = analysis.status === 'analysed' && analysis.classificationStatus === 'classified'
  if (!status) {
    return res.status(400).send('File is not yet analysed and classified')
  }

  try {
    await classification.checkAndPrepareTrainingFile(req.user._id)
    await classification.addToModel(filePath, id, req.user._id)
    // change model status
    analyses.changeModelStatus(id, req.user._id, true)
    return res.status(200).send({
      id: id,
      status: 'File was found, was added to Machine Learning model'
    })
  } catch (e) {
    return res.status(500).send()
  }
}

async function removeFromModel (req, res) {
  var id = req.params.id
  if (!id) {
    return res.status(404).send('ID not supplied')
  }

  try {
    await classification.checkAndPrepareTrainingFile(req.user._id)
    await classification.removeFromModel(id, req.user._id)
    // change model status
    analyses.changeModelStatus(id, req.user._id, false)
    return res.status(200).send({
      id: id,
      status: 'Records matching the id were removed from the Machine Learning model'
    })
  } catch (e) {
    return res.status(500).send()
  }
}

async function startClassification(req, res) {
  var id = req.params.id
  if (!id) {
    return res.status(404).send('ID not supplied')
  }
  var filePath = path.resolve(analysisBaseDir, req.user._id, id, `${id}.pcap-ML-features.csv`)
  try {
    fs.statSync(filePath)
  } catch (e) {
    return res.status(404).send('ID unknown')
  }
  var analysis = await analyses.getAnalysis(id, req.user._id)
  if(!analysis) {
    return res.status(404).send('File was found but no corresponding database entry. Check upload?')
  }
  var analysisRequestedByUploader = req.user._id === analysis.uploader
  if(!analysisRequestedByUploader) {
    return res.status(403).send('Unauthorized to start analysis on a dataset that was uploaded with different account')
  }

  if (analysis.status !== 'analysed') {
    return res.status(400).send('Can\'t start classification as analysis has not yet been performed successfully.')
  }

  if (analysis.classificationStatus === 'in progress') {
    return res.status(400).send('Classification is already in progress.')
  }

  if (analysis.classificationType = 'auto') {
    try {
      analyses.changeClassificationStatus(id, req.user._id, 'in progress')

      var mlResults = await classification.machineLearning(filePath, analysis.algorithm, req.user._id)

      var occurrences = []
      attackTypes.map(a => occurrences.push(0))
      mlResults.map(type => occurrences[type] += 1)

      // find time-based json file
      var jsonIndex = analysis.analysisFiles.findIndex(file => file.file.endsWith('.pcap-ML-features.json'))
      var fullJSONFileName = analysisBaseDir + '/' + analysis.analysisFiles[jsonIndex].file

      fs.readFile(fullJSONFileName, 'utf8', (err, data) => {
        if (err) { console.log(`Error reading file from disk: ${err}`); }
        else {
          var JSONFeatures = JSON.parse(data);
          JSONFeatures.linechart.datasets[0].data = mlResults

          fs.writeFile(fullJSONFileName, JSON.stringify(JSONFeatures), 'utf8', (err) => {
              if (err) {
                console.log(`Error writing file: ${err}`);
              } else {
                console.log(`File is written successfully!`);
              }
            });
        }
      });

      // find distribution json file
      var jsonIndex2 = analysis.analysisFiles.findIndex(file => file.file.endsWith('.pcap-ML-features-pie.json'))
      var fullJSONFileName2 = analysisBaseDir + '/' + analysis.analysisFiles[jsonIndex2].file

      fs.readFile(fullJSONFileName2, 'utf8', (err, data) => {
        if (err) { console.log(`Error reading file from disk: ${err}`); }
        else {
          var JSONFeatures2 = JSON.parse(data);
          JSONFeatures2.piechart.datasets[0].data = occurrences

          fs.writeFile(fullJSONFileName2, JSON.stringify(JSONFeatures2), 'utf8', (err) => {
              if (err) {
                console.log(`Error writing file: ${err}`);
              } else {
                console.log(`File is written successfully!`);
              }
            });
        }
      });
      analyses.changeClassificationStatus(id, req.user._id, 'classified')
    } catch (e) {
      analyses.changeClassificationStatus(id, req.user._id, 'failed')
    }
  }
}

async function getModelDataStats(req, res) {
  await classification.checkAndPrepareTrainingFile(req.user._id)

  try {
    var finalStats = {}
    var evalResults = ''

    var size = await classification.getModelSize(req.user._id)
    var fileLines = await classification.countFileLines(req.user._id)
    var all = await analyses.getAnalysesOfUser(req.user._id)
    var distribution = await classification.getModelDistribution(req.user._id)
    var inmodelcounter = 0
    for (var analysis of all) {
      if (analysis.inmodel) {
        inmodelcounter += 1
      }
    }

    finalStats.size = size
    finalStats.nrdatasets = inmodelcounter
    finalStats.lineCount = fileLines - 1
    finalStats.distribution = distribution

    return res.status(200).send(finalStats)
  } catch (e) {
    console.log(e);
    return res.status(400).send('Error trying to get model stats.')
  }
}

async function getModelEvaluation(req, res) {
  await classification.checkAndPrepareTrainingFile(req.user._id)

  var id = req.params.id
  if (!id) {
    return res.status(400).send('Algorithm ID not supplied')
  }
  if (algorithms.findIndex(algo => algo.id === id) === -1) {
    return res.status(400).send('Unknown Algorithm Id supplied')
  }
  try {
    var evalResults = ''
    var fileLines = await classification.countFileLines(req.user._id)

    if (fileLines > 1) {
      evalResults = await classification.runEvaluation(id, req.user._id)
    }
    return res.status(200).send(evalResults)
  } catch (e) {
    console.log(e);
    return res.status(400).send('Error trying to get model evaluation.\nThis error might occurr when trying to evaluate models that have severely underrepresented classes.\nTry again.')
  }
}

async function deleteModel(req, res) {
  await classification.checkAndPrepareTrainingFile(req.user._id)

  try {
    await classification.resetTrainingFile(req.user._id)
    var all = await analyses.getAnalysesOfUser(req.user._id)
    for (var analysis of all) {

      analyses.changeModelStatus(analysis.md5, req.user._id, false)
    }
    return res.status(200).send({
      status: 'Model was deleted and reset'
    })
  } catch (e) {
    console.log(e);
    return res.status(500).send()
  }
}

module.exports = router
