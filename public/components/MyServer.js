import React from 'react';
import actions from '../actions/ipsumActions.js';
import { connect } from 'react-redux';
import { renderChart } from '../D3graphTemplate';
import { Panel, Grid, Row, Col, Clearfix, PageHeader, ListGroup, ListGroupItem } from 'react-bootstrap';
import request from '../util/restHelpers.js';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import Select from 'react-select';
import _ from 'underscore';
import { LineChart } from 'rd3';

class MyServer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lineGraphRoute: null,
      resizefunc: null
    };
  }

  componentDidMount() { 
    this.props.dispatch(actions.ADD_LINE_GRAPH_TITLE('/Total'));
    var servId = this.props.state.serverSelection.id;
    request.post('/getStats/server',
      {serverId: servId, hours: 24}, //TODO figure out how to keep track of desired hours, have user settings/config in store?
      (err, res) => {
        if (err) { console.log("Error getting Server Data", err); }
        this.props.dispatch(actions.ADD_SERVER_DATA(res.body));
        this.setState({lineGraphRoute: this.props.state.graphData[0].route});
        renderChart('lineGraph', this.props.state.graphData[0].data);
      }
    );

    this.setState({resizefunc: this.resizedb()}, () => {
      window.addEventListener('resize', this.state.resizefunc);
    })
  }

  resizedb() {
    var redraw = function() {
      this.updateGraph({value: this.state.lineGraphRoute});
    }
    return _.debounce(redraw.bind(this), 500)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.state.resizefunc);
  }

  updateGraph(value) {
    !value ? null : 
    this.setState({lineGraphRoute: value.value});
    this.props.dispatch(actions.ADD_LINE_GRAPH_TITLE("/" + value.value));
    d3.select('#lineGraph > svg').remove(); 
    renderChart('lineGraph', _.findWhere(this.props.state.graphData, {route: value.value}).data);
  }

  render() {

    var lineGraphOptions = this.props.state.graphData.map((graph) => {return {label: '/'+graph.route, value: graph.route}});

    return (
      <Grid>
        <Row><Col xs={12} md={12}><PageHeader>{this.props.state.serverSelection.hostname} <small>at a glance</small></PageHeader></Col></Row>
        <Row className="server-control-panel">
          <Col xs={12} md={12}>
            <Panel header={<h1>Control Panel</h1>}>
            Cool controls to come! Scale up, scale down, emergency shut down, etc.<br/>
              <span style={{textDecoration:'underline'}}>Server:  </span> {this.props.state.serverSelection.hostname}<br/>
              <span style={{textDecoration:'underline'}}>IP:  </span> {this.props.state.serverSelection.ip}<br/>
              <span style={{textDecoration:'underline'}}>Status:  </span> {this.props.state.serverSelection.active}<br/>
              <span style={{textDecoration:'underline'}}>Platform:  </span> {this.props.state.serverSelection.platform}<br/>
            </Panel>
          </Col>
        </Row>


        <Row className='serverStatContainer'>
        <Col xs={12} md={12} lg={12}>
        <Panel header={<div>Routes</div>}>
        <Grid fluid>
          <Row>
            <Col xs={12} lg={12}>
              <Select
                value={this.state.lineGraphRoute}
                multi={false}
                options={lineGraphOptions}
                onChange={this.updateGraph.bind(this)}
                />
              <h4 className="xAxis-title">Hits Per Hour Today</h4>
              <p className="xAxis-subtitle">for {this.props.state.lineGraphTitle == '/Total' ? 'all monitored routes' : <i>{this.props.state.lineGraphTitle}</i>}</p>
              <div id="lineGraph"></div>
              <h5 className="xAxis-title">Hours Ago</h5>

            </Col>
          </Row>
        </Grid>
        </Panel>
        </Col>
        </Row>
      </Grid>
    );
  }
}

MyServer = connect(state => ({ state: state }))(MyServer);
export default MyServer;
