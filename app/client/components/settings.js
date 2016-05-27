import React from 'react'
import 'whatwg-fetch'

export default class Settings extends React.Component {
  constructor () {
    super()

    this.state = {
      admins: [],
      error: ''
    }
  }

  getAdmins () {
    return window.fetch('/admin-list', {
      method: 'GET'
    })
    .then((response) => {
      return response.json()
    })
    .then((admins) => {
      this.setState({
        admins: admins
      })
    })
  }

  updateUser () {
    if (!this.refs.pass1.value ||
        this.refs.pass1.value !== this.refs.pass2.value) return

    window.fetch('/admin-add', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pass: this.refs.pass1.value,
        update: true
      })
    })
    .then((response) => {
      if (response.status === 200) {
        window.location.reload()
      } else {
        this.setState({
          error: 'Failed to update user.'
        })
      }
    })
  }

  deleteAdmin (admin) {
    window.fetch('/admin-delete', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: admin
      })
    })
    .then((response) => {
      if (response.status === 200) {
        window.location.reload()
      } else {
        this.setState({
          error: 'Failed to delete user.'
        })
      }
    })
  }

  addUser () {
    if (!this.refs.user.value ||
        !this.refs.pass.value) {
      return
    }

    window.fetch('/admin-add', {
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
          error: 'Failed to add user.'
        })
      }
    })
  }

  logout () {
    window.fetch('/admin-logout', {
      method: 'GET'
    })
    .then(() => window.location.reload())
  }

  render () {
    return (
      <div
        className='wrapper settings'>
        <input ref='pass1' placeholder='new password' type='text' />
        <input ref='pass2' placeholder='repeat' type='text' />
        <button onClick={this.updateUser.bind(this)}>update</button>
        <hr />
        <table className='admin-table'>
          <tbody>
            {this.state.admins.map((admin) => {
              return (
                <tr key={admin}>
                  <td>{admin}</td>
                  <td>
                    <div onClick={this.deleteAdmin.bind(this, admin)}>
                      &times;
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <br />
        <input ref='user' placeholder='username' type='text' />
        <input ref='pass' placeholder='password' type='text' />
        <button onClick={this.addUser.bind(this)}>add user</button>
        <hr />
        {/* <button
          className='edit-button'
          onClick={this.save.bind(this, 'settings')}>
          save
        </button> */}
        <button onClick={this.logout.bind(this)}>log out</button>
      </div>
    )
  }
}
