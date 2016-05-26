import React from 'react'
import {render} from 'react-dom'
import {browserHistory, Router, Route, Link} from 'react-router'
import 'whatwg-fetch'

class App extends React.Component {
  constructor () {
    super()

    this.state = {
      config: [],
      content: [],
      initiated: false,
      loading: false,
      posting: false,
      more: true,
      edit: -1,
      tab: 0
    }
  }

  componentDidMount () {
    window.fetch('/data/pages')
      .then((response) => {
        return response.json()
      })
      .then((config) => {
        this.setState({
          config
        }, () => {
          this.content().then(() => {
            for (let i in this.state.config) {
              if (this.state.config[i].name === this.props.params.page) {
                this.tab(parseInt(i))
                break
              }
            }

            this.setState({
              edit: this.props.params.item || -1
            })
          })
        })
      })
      .catch((ex) => {
        console.log('Failed to load page data.', ex)
      })
  }

  save (page, update, e) {
    e.preventDefault()

    this.setState({
      posting: true
    })

    let row = {}

    page.fields.map((field) => {
      row[field.name] = this.refs[field.name].value
    })

    if (this.state.edit > -1) {
      row.created = this.state.content[this.state.edit].created
    }

    window.fetch('/data/save', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: page.name,
        row: row,
        update: update
      })
    })
    .then(() => {
      this.setState({
        posting: false
      })
    })
    .catch(() => {
      this.setState({
        posting: false
      })
    })
  }

  content (start = 0) {
    this.setState({
      loading: true
    })

    const url = `/data/get/${this.state.config[this.state.tab].name}`

    return window.fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: start,
        limit: 5
      })
    })
    .then((response) => {
      return response.json()
    })
    .then((content) => {
      this.setState({
        content: this.state.content.concat(content),
        loading: false,
        more: content.length >= 5,
        initiated: true
      })
    })
  }

  tab (tab) {
    this.setState({
      tab,
      content: []
    }, () => this.state.tab < this.state.config.length && this.content())
  }

  edit (edit) {
    this.setState({
      edit
    })
  }

  logout () {
    window.fetch('/admin-logout', {
      method: 'GET'
    })
    .then(() => window.location.reload())
  }

  delete (page, i, e) {
    e.preventDefault()
    e.stopPropagation()

    window.fetch('/data/delete', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: page,
        created: this.state.content[i].created
      })
    })

    this.state.content.splice(i, 1)

    this.setState({
      content: this.state.content,
      edit: -1
    })

    browserHistory.push(`/admin/${this.props.params.page}`)
  }

  render () {
    let page = this.state.config[this.state.tab]

    if (!this.state.config.length || !this.state.initiated) {
      return <div />
    }

    return (
      <div>
        <div className='admin-tabs'>
          {this.state.config.map((page, i) => {
            return (
              <Link
                to={`/admin/${page.name}`}
                className={this.state.tab === i ? 'selected' : ''}
                onClick={this.tab.bind(this, i)}
                key={i}>
                {page.name}
              </Link>
            )
          })}
          <div
            className={this.state.config.length === this.state.tab ? 'selected' : ''}
            onClick={this.tab.bind(this, this.state.config.length)}
            key='settings'>
            settings
          </div>
        </div>
        <div className='admin-pages'>
          {page
            ? (
            <div
              className='wrapper'
              style={{}}
              key={page.name}>
              {page.fields.map((field, i) => {
                return (
                  <div key={i + this.state.edit + this.state.content.length}>
                    <br />
                    {field.type === 'textarea'
                      ? <textarea
                        defaultValue={
                          this.state.content[this.state.edit] && this.state.edit > -1
                            ? this.state.content[this.state.edit][field.name]
                            : ''
                          }
                        disabled={this.state.posting}
                        ref={field.name}
                        placeholder={field.name}>
                      </textarea>
                      : <input
                        defaultValue={
                          this.state.content[this.state.edit] && this.state.edit > -1
                            ? this.state.content[this.state.edit][field.name]
                            : ''
                          }
                        disabled={this.state.posting}
                        type={field.type}
                        ref={field.name}
                        placeholder={field.name} />
                    }
                    <br />
                  </div>
                )
              })}
              <br />
              {this.state.edit < 0
                ? <button
                  disabled={this.state.posting}
                  onClick={this.save.bind(this, page, false)}>
                  {this.state.posting ? 'posting...' : 'add new'}
                </button>
                : <button
                  className='edit-button'
                  disabled={this.state.posting}
                  onClick={this.save.bind(this, page, true)}>
                  {this.state.posting ? 'saving...' : 'update'}
                </button>}
                {this.state.edit > -1 &&
                  <Link
                    className='button'
                    to={`/admin/${this.props.params.page}`}
                    onClick={this.edit.bind(this, -1)}>
                    cancel
                  </Link>
                }
              <br />
              <br />
              <br />
              {this.state.content.length
                ? <div>
                  {this.state.content.map((item, i) => {
                    return (
                      <Link
                        to={`/admin/${page.name}/${i}`}
                        onClick={this.edit.bind(this, i)}
                        className='item' key={i}>
                        {Object.keys(item).map((key) => {
                          if (key !== 'created' && key !== 'published') {
                            return <div key={key}>{key}: {item[key]}</div>
                          }
                        })}
                        <div
                          onClick={this.delete.bind(this, page.name, i)}
                          className='cross'>
                          &times;
                        </div>
                      </Link>
                    )
                  })}
                  {this.state.more &&
                    <button onClick={this.content.bind(this, this.state.content.length)}>
                      load more
                    </button>
                  }
                </div>
                : <div>{this.state.loading ? 'Loading...' : 'No content.'}</div>
              }
            </div>)
            : (
            <div
              className='wrapper'
              key='settings'>
              <br />
              <br />
              <button
                className='edit-button'
                onClick={this.save.bind(this, 'settings')}>
                save
              </button>
              <button onClick={this.logout.bind(this)}>log out</button>
            </div>
            )}
        </div>
      </div>
    )
  }
}

render((
  <Router history={browserHistory}>
    <Route path='/admin' component={App} />
    <Route path='/admin/:page' component={App} />
    <Route path='/admin/:page/:item' component={App} />
  </Router>
), document.getElementById('app'))
