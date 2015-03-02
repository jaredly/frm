
import React from 'react'
import assign from 'object-assign'
let {update} = React.addons

export default React.createClass({
  getInitialState() {
    // TODO validation, etc.
    return {data: assign({}, this.props.initialData)}
  },

  canSubmit() {
    // TODO validate
    return true
  },

  _handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!this.canSubmit()) return
    this.props.onSubmit(assign({}, this.state.data))
    this.setState({data: assign({}, this.props.initialData)})
  },

  _onChange(name, value) {
    this.setState({
      data: update(this.state.data, {[name]: {$set: value}})
    })
  },

  _onChangeEvt(name, evt) {
    this._onChange(name, evt.target.value)
  },

  _onKeyDown(evt) {
    if (this.props.submitOnCtrlEnter) {
      if (evt.key === 'Enter' && evt.ctrlKey) {
        evt.preventDefault()
        this._handleSubmit(evt)
      }
    }
    if (this.props.cancelOnEscape) {
      if (evt.key == 'Escape') {
        evt.preventDefault()
        this.props.onCancel(evt)
      }
    }
  },

  processChildren() {
    return crawlChildren(this.props.children, child => {
      if (!child.type || !child.props) return {}
      // <button type="submit"> or <input type="submit">
      if (child.props.type === 'submit') {
        return {
          disabled: !this.canSubmit(),
          onClick: this._handleSubmit
        }
      }
      if (!child.props.name) return {}
      let name = child.props.name

      // radio buttons are different
      if (child.type === 'input' && child.props.type === 'radio') {
        return {
          checked: this.state.data[name] === child.props.value,
          onChange: e => e.target.checked && this._onChange(name, child.props.value)
        }
      }
      // check box
      if (child.type === 'input' && child.props.type === 'checkbox') {
        return {
          checked: !!this.state.data[name],
          onChange: e => this._onChange(name, e.target.checked)
        }
      }

      // normal inputs
      child.props.value = this.state.data[name]
      if ('string' === typeof child.type) {
        let props = {
          value: this.state.data[name],
          onChange: this._onChangeEvt.bind(null, name),
        }
        if (child.type === 'textarea' && (this.props.submitOnCtrlEnter || this.props.cancelOnEscape)) {
          props.onKeyDown = this._onKeyDown.bind(null)
        }
        return props
      } else {
        // custom input types are expected to call the `onChagne` prop with a
        // real value, not an event object.
        return {
          value: this.state.data[name],
          onChange: this._onChange.bind(null, name),
        }
      }
    })
  },

  render() {
    return <form
        onSubmit={this._handleSubmit}
        className={'Form ' + (this.props.className || '')}>
      {this.processChildren()}
    </form>
  }
})

function crawlChildren(children, fn) {
  if (!children) return
  return React.Children.map(children, child =>
    (child && child.props) ?
      React.addons.cloneWithProps(child, assign(fn(child), {
        children: crawlChildren(child.props.children, fn)
      })) : child)
}
