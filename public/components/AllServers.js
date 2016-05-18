import React from 'react';
import actions from '../actions/ipsumActions.js';
import { connect } from 'react-redux';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { Link } from 'react-router';
import _ from 'underscore';
import request from '../util/restHelpers.js';
import {Grid, Row, Col} from 'react-bootstrap';


const selectRowProp = {
  mode: 'checkbox',
  bgColor: 'rgb(238, 193, 213)',
};

class AllServers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  tableLinkForm(cell) {
    return (
      <Link to="/myServer">
        <div onClick={this.goToServer.bind(this, cell)}>
        ===>
        </div>
      </Link>
      );
  }

  goToServer(cell) {
    let serverSelection = _.findWhere(this.refs.table.props.data, {id: cell})
    this.props.dispatch(actions.ADD_SERVER_SELECTION(serverSelection));
  }

  goToApp(appId) {
    var apps = this.props.state.applications;
    var app;
    for (var i = 0; i < apps.length; i++) {
      if (apps[i].id === appId) {
        app = apps[i];
        break;
      }
    }
    this.props.dispatch(actions.ADD_APP_SELECTION(app));
  }

  tableAppsLinkForm(cell) {
    return (
      <div>
        {cell.map((app) => {
          return (<div key={app[0]+app[1]}><Link onClick={this.goToApp.bind(this, app[0])} to="/myApp">{app[1]}</Link></div>);
        })}
      </div>
    );
  }

  enumFormatter(cell, row, enumObject) {
    return enumObject(cell);
  }

  render() {
    return (
      <Grid><Row><Col md={12} xs={12}>
        <BootstrapTable ref='table' data={this.props.state.servers} striped={true} hover={true} selectRow={selectRowProp} search={true}>
          <TableHeaderColumn dataField="id" isKey={true} dataAlign="center" dataSort={true}>Server ID</TableHeaderColumn>
          <TableHeaderColumn dataField="ip" dataAlign="center" dataSort={true}>Server IP</TableHeaderColumn>
          <TableHeaderColumn dataField="hostname" dataAlign="center" dataSort={true}>Hostname</TableHeaderColumn>
          <TableHeaderColumn dataField="platform" dataSort={true}>Platform</TableHeaderColumn>
          <TableHeaderColumn dataField="active" dataSort={true}>Status</TableHeaderColumn>
          <TableHeaderColumn dataField="apps" dataFormat={this.enumFormatter} formatExtraData={this.tableAppsLinkForm.bind(this)}>Application</TableHeaderColumn>
          <TableHeaderColumn dataField="id" dataFormat={this.enumFormatter} formatExtraData={this.tableLinkForm.bind(this)}>See Stats</TableHeaderColumn>
        </BootstrapTable>
      </Col></Row></Grid>
    );
  }
}

AllServers = connect(state => ({ state: state }))(AllServers);
export default AllServers;
