const mocha = require('mocha');
const chai = require('chai');
const requestP = require('request-promise');
const pgp = require('pg-promise')({});
const expect = chai.expect;
const assert = chai.assert;

/* simulate production env for testing */
process.env.NODE_ENV = 'production';
const app = require('../server/server');

describe('Client Integration Tests', () => {
  // just describe needed vars
  var server, port;
  var client = pgp({
    connectionString: process.env.PG_CONNECTION_STRING
  });

  // stuff we need to keep track of  
  var hash = null;
  var appID = null;
  var serverID = null;
  
  // describe setup
  before((next) => {
    // creating listener with random port
    server = app.listen( () => {
      // store port when its ready
      port = server.address().port;

      // setup db connection      
      client.connect()
        .then((result) => {
          return client.query('DELETE FROM "clientServers" WHERE ip = ${ip}' +
            '; DELETE FROM "clientApps" WHERE "appname" = ${appname}', {
              ip: '127.0.0.1',
              appname: 'testapp'
            });
        })
        .then((result) => {
          // don't really care about the result
          next();
        })
        .catch((error) => {
          console.log('ERROR: Failed in setting up database connection.', error);
        });    
    });
  });

  // tests
  it('should return a hash when registering', (done) => {
    // do a simple request to /api/some
    requestP({
      method: 'POST',
      uri: 'http://localhost:' + port + '/stats/register',
      json: true,
      body: {
        ip: '127.0.0.1',
        hostname: 'testhost',
        appname: 'testapp'
      }
    })
      .then((response) => {
        expect(response).to.exist;
        hash = response;
        done();
      })
      .catch((error) => {
        expect(error).to.not.exist;
        done();
      });
  });
  
  it('should find an entry for the server', (done) => {
    client.one('SELECT * FROM "clientServers" WHERE "ip" = ${ip}', { ip: '127.0.0.1' })
      .then((result) => {
        expect(result).to.exist;
        expect(result.ip).to.equal('127.0.0.1');
        expect(result.hostname).to.equal('testhost');
        serverID = result.id;
        done();
      })
      .catch((error) => {
        console.log(error);
        expect(error).to.not.exist;
        done();
      });
  });

  it('should find an entry for the app', (done) => {
    client.one('SELECT * FROM "clientApps" WHERE "appname" = ${appname}', { appname: 'testapp' })
      .then((result) => {
        expect(result).to.exist;
        expect(result.appname).to.equal('testapp');
        appID = result.id;
        done();
      })
      .catch((error) => {
        console.log(error);
        expect(error).to.not.exist;
        done();
      });
  });

  it('should accept statistics POST', (done) => {
    requestP({
      method: 'POST',
      uri: 'http://localhost:' + port + '/stats',
      json: true,
      body: {
        hash: hash,
        token: null,
        statistics: {
          dummyPath: 3,
          dummyPath2: 12
        }
      }
    })
      .then((response) => {
        // maybe we should return something later
        // wait 250 ms for sql stores to take place
        setTimeout(done, 250);
      })
      .catch((error) => {
        expect(error).to.not.exist;
        done();
      });
  });

  it('should store statistics in stats table', (done) => {
    client.query('SELECT * FROM "stats" WHERE "clientApps_id" = ${appID} AND "clientServers_id" = ${serverID}',
    { appID: appID, serverID: serverID })
      .then((result) => {
        expect(result).to.have.length(2);
        expect(result[0].statName).to.equal('dummyPath');
        expect(result[0].statValue).to.equal(3);
        expect(result[1].statName).to.equal('dummyPath2');
        expect(result[1].statValue).to.equal(12);
        done();
      })
      .catch((error) => {
        expect(error).to.not.exist;
        done();
      });
  });

  // teardown
  after(() => {
    // stop listening that port
    client.query('DELETE FROM "clientServers" WHERE ip = ${ip}' +
      '; DELETE FROM "clientApps" WHERE "appname" = ${appname}', {
        ip: '127.0.0.1',
        appname: 'testapp'
      });
    server.close();
  });

});