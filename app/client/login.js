import React from 'react'
import {render} from 'react-dom'
import 'whatwg-fetch'

class App extends React.Component {
  constructor () {
    super()

    this.state = {
      error: ''
    }
  }

  login () {
    window.fetch((window.signup ? '/admin-add' : '/admin-login'), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: this.refs.user.value,
        pass: this.refs.pass.value
      })
    })
    .then((response) => {
      if (response.status === 200) {
        window.location.reload()
      } else {
        this.setState({
          error: 'Sign-in failed.'
        })
      }
    })
  }

  render () {
    return (
      <div className='admin-login'>
        {this.state.error && <span>{this.state.error}</span>}
        <div>
          <h4>sign {window.signup ? 'up' : 'in'}</h4>
          <input ref='user' type='text' placeholder='user' />
          <br />
          <input ref='pass' type='password' placeholder='password' />
          <br />
          <button className='button' onClick={this.login.bind(this)}>login</button>
        </div>
      </div>
    )
  }
}

render((
  <App />
), document.getElementById('app'))
