const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Db Error ${e.message}`)
  }
}

initializeDbAndServer()
app.use(express.json())

const snakeCaseToCamelCase1 = dataObject => {
  return {
    stateId: dataObject.state_id,
    stateName: dataObject.state_name,
    population: dataObject.population,
  }
}
const snakeCaseToCamelCase2 = dataObject => {
  return {
    districtId: dataObject.district_id,
    districtName: dataObject.district_name,
    stateId: dataObject.state_id,
    cases: dataObject.cases,
    cured: dataObject.cured,
    active: dataObject.active,
    deaths: dataObject.deaths,
  }
}

const stateNameCamelCase = dataObject1 => {
  return {
    stateName: dataObject1.state_name,
  }
}

// .... get List of states

app.get('/states/', async (requset, response) => {
  const getListOfStates = `SELECT * FROM state;`
  const dbResponse = await db.all(getListOfStates)
  response.send(dbResponse.map(eachData => snakeCaseToCamelCase1(eachData)))
})

// .... get only one state based on given ID

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getOnlyOneStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`
  const dbResponse = await db.get(getOnlyOneStateQuery)
  response.send(snakeCaseToCamelCase1(dbResponse))
})

//post a new district in district table

app.post('/districts/', async (request, response) => {
  const queryDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = queryDetails
  const postDistrictDetailsQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  const dbResponse = await db.run(postDistrictDetailsQuery)
  const districtId = dbResponse.lastID
  response.send('District Successfully Added')
})

// ..... get only one district based on given ID

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getOnlyOneDistrict = `SELECT * FROM district WHERE district_id = ${districtId};`
  const dbResponse = await db.get(getOnlyOneDistrict)
  response.send(snakeCaseToCamelCase2(dbResponse))
})

// delete a district based on districtId in district table

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDeleteQuery = `DELETE FROM district WHERE district_id = ${districtId}`
  const dbResposne = await db.get(districtDeleteQuery)
  response.send('District Removed')
})

// update district table based on given query

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const updateDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = updateDetails
  const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} WHERE district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  //const districtId = dbResponse.lastID
  response.send('District Details Updated')
})

// get the details of stats from district table using stateId

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const sumOfStatsOfAStateQuery = `SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths FROM district WHERE state_id = ${stateId};`
  const dbResponse = await db.get(sumOfStatsOfAStateQuery)
  response.send(dbResponse)
})

// ...... get only state name based on given districtId

// app.get('/districts/:districtId/details/', async (request, response) => {
//   const {districtId} = request.params
//   const getDistrictDetailsQuery = `SELECT state.state_name FROM district inner join state on state.state_id = district.state_id WHERE district.district_id = ${districtId}; `
//   const queryResponse = await db.all(getDistrictDetailsQuery)
//   response.send(stateNameCamelCase(queryResponse))
// })

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    ` //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    ` //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
