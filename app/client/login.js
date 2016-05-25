import React from 'react'
import {render} from 'react-dom'
import 'whatwg-fetch'

class App extends React.Component {
  constructor () {
    super()

    this.state = {
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
      console.log(response)
    })
  }

  render () {
    return (
      <div>
        <h4>Please sign {window.signup ? 'up' : 'in'}</h4>
        <input ref='user' type='text' placeholder='user' />
        <br />
        <br />
        <input ref='pass' type='password' placeholder='password' />
        <br />
        <br />
        <button onClick={this.login.bind(this)}>login</button>
      </div>
    )
  }
}

render((
  <App />
), document.getElementById('app'))
