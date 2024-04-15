const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
let db = null
const dbpath = path.join(__dirname, 'covid19India.db')
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (e) {
    console.log(`${e.message}`)
  }
}
initializeDbAndServer()
const convertTableToDb = each => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }
}

app.get('/states/', async (request, response) => {
  const getStateQuery = `
    SELECT *
    FROM 
    state`
  const dbresponse = await db.all(getStateQuery)
  response.send(dbresponse.map(eachState => convertTableToDb(eachState)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT *
  FROM state
  WHERE
  state_id=${stateId}`
  const dbresponse = await db.get(stateQuery)
  response.send(convertTableToDb(dbresponse))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const districtQuery = `
  INSERT INTO 
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  `
  const dbresponse = await db.run(districtQuery)
  response.send('District Successfully Added')
})
const getdistrictQuery = each => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  }
}
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `
  SELECT *
  FROM 
  district 
  WHERE 
  district_id=${districtId};`
  const dbresponse = await db.get(districtQuery)
  response.send(getdistrictQuery(dbresponse))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
   DELETE FROM 
   district 
   WHERE district_id=${districtId}`
  const dbresponse = await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const putdistrictQuery = `
  UPDATE 
  district
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  `
  const dbresponse = await db.run(putdistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths) 
  FROM 
  district
  WHERE 
  state_id=${stateId}`
  const stats = await db.get(getStateStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})
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
