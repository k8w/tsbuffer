/** @internal */
export class InterfaceKeyFilter {
  pick?: string[]
  omit?: string[]

  private static _pool: InterfaceKeyFilter[] = []
  static get(): InterfaceKeyFilter {
    let item = this._pool.pop() || new InterfaceKeyFilter()
    item.reset()
    return item
  }
  static put(item: InterfaceKeyFilter) {
    item.reset()
    this._pool.push(item)
  }

  /** 调用方保证pick和omit已经去重 */
  reset(pick?: string[], omit?: string[]) {
    this.pick = pick
    this.omit = omit
  }

  addPickKeys(keys: string[]) {
    // 取交集
    if (!this.pick) {
      this.pick = keys.slice()
    } else {
      this.pick = this.pick.filter(v => keys.indexOf(v) > -1)
    }
  }

  addOmitKeys(keys: string[]) {
    // 取并集
    if (!this.omit) {
      this.omit = keys.slice()
    } else {
      for (let key of keys) {
        this.omit.indexOf(key) === -1 && this.omit.push(key)
      }
    }
  }

  validate(value: { [key: string]: any }): { isSucc: true } | { isSucc: false; key: string } {
    // Omit 不能出现
    if (this.omit) {
      for (let key of this.omit) {
        if (value[key] !== undefined) {
          return { isSucc: false, key: key }
        }
      }
    }

    // Pick 不能出现其它
    if (this.pick) {
      for (let key in value) {
        if (this.pick.indexOf(key) === -1) {
          return { isSucc: false, key: key }
        }
      }
    }

    return { isSucc: true }
  }

  canExist(key: string): boolean {
    // Omit 不能出现
    if (this.omit && this.omit.indexOf(key) === -1) {
      return false
    }

    // Pick 不能出现其它
    if (this.pick && this.pick.indexOf(key) !== -1) {
      return false
    }

    return true
  }
}
