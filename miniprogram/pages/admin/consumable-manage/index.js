const { getConsumables, saveConsumable } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

const MODE_OPTIONS = [
  { key: 'catalog', label: '基础信息' },
  { key: 'inbound', label: '入库' },
  { key: 'outbound', label: '出库' },
  { key: 'stocktake', label: '盘点' }
]

const FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'warning', label: '预警' },
  { key: 'normal', label: '正常' },
  { key: 'empty', label: '零库存' }
]

function createEmptyForm() {
  return {
    id: '',
    name: '',
    category: '',
    unit: '',
    stock: '',
    warningValue: ''
  }
}

function createEmptyOperationForm() {
  return {
    consumableId: '',
    quantity: ''
  }
}

function normalizeConsumable(item) {
  const stock = Number(item.stock) || 0
  const warningValue = Number(item.warningValue) || 0
  const unit = item.unit || ''
  const isLowStock = stock <= warningValue
  const isEmptyStock = stock <= 0

  return {
    ...item,
    stock,
    warningValue,
    unit,
    isLowStock,
    isEmptyStock,
    statusText: isEmptyStock ? '零库存' : isLowStock ? '库存预警' : '库存正常',
    statusClass: isEmptyStock ? 'status-maintenance' : isLowStock ? 'status-pending' : 'status-approved',
    warningHint: isLowStock
      ? `低于预警值 ${warningValue}${unit}`
      : `高于预警值 ${stock - warningValue}${unit}`
  }
}

function buildStats(list) {
  const warningCount = list.filter((item) => item.isLowStock).length
  const emptyCount = list.filter((item) => item.isEmptyStock).length
  const normalCount = list.length - warningCount

  return [
    { label: '耗材种类', value: list.length, intro: '当前库存品类' },
    { label: '库存预警', value: warningCount, intro: '需要及时补货' },
    { label: '库存正常', value: normalCount, intro: '高于预警阈值' },
    { label: '零库存', value: emptyCount, intro: '优先处理缺货' }
  ]
}

function buildOperationMeta(mode, target, inputValue) {
  const metaMap = {
    catalog: {
      title: '新增或编辑耗材',
      desc: '维护耗材名称、分类、库存和预警阈值。',
      submitLabel: '保存耗材'
    },
    inbound: {
      title: '耗材入库',
      desc: '录入补货数量，直接增加当前库存。',
      inputLabel: '入库数量',
      placeholder: '请输入本次入库数量',
      submitLabel: '确认入库'
    },
    outbound: {
      title: '耗材出库',
      desc: '处理领用、损耗等场景，直接扣减当前库存。',
      inputLabel: '出库数量',
      placeholder: '请输入本次出库数量',
      submitLabel: '确认出库'
    },
    stocktake: {
      title: '库存盘点',
      desc: '按实际库存校正系统数量。',
      inputLabel: '盘点实存',
      placeholder: '请输入盘点后的实际库存',
      submitLabel: '确认盘点'
    }
  }

  const meta = metaMap[mode] || metaMap.catalog
  if (!target || mode === 'catalog') {
    return {
      ...meta,
      helperText: '',
      previewText: ''
    }
  }

  const helperText = `当前库存 ${target.stock}${target.unit}，预警值 ${target.warningValue}${target.unit}。`
  const value = Number(inputValue)
  if (!Number.isInteger(value) || value < 0) {
    return {
      ...meta,
      helperText,
      previewText: ''
    }
  }

  let previewText = ''
  if (mode === 'inbound') {
    previewText = `执行后库存将从 ${target.stock}${target.unit} 增加到 ${target.stock + value}${target.unit}。`
  } else if (mode === 'outbound') {
    previewText = value > target.stock
      ? `当前最多可出库 ${target.stock}${target.unit}。`
      : `执行后库存将从 ${target.stock}${target.unit} 减少到 ${target.stock - value}${target.unit}。`
  } else if (mode === 'stocktake') {
    const variance = value - target.stock
    const prefix = variance > 0 ? '盘盈' : variance < 0 ? '盘亏' : '无差异'
    previewText = `${prefix} ${Math.abs(variance)}${target.unit}，盘点后库存为 ${value}${target.unit}。`
  }

  return {
    ...meta,
    helperText,
    previewText
  }
}

Page({
  data: {
    list: [],
    filteredList: [],
    lowStockList: [],
    stats: [],
    form: createEmptyForm(),
    operationForm: createEmptyOperationForm(),
    operationMode: 'catalog',
    operationMeta: buildOperationMeta('catalog'),
    operationTarget: null,
    operationIndex: 0,
    modeOptions: MODE_OPTIONS,
    filterOptions: FILTER_OPTIONS,
    activeFilter: 'all'
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/consumable-manage/index' })
    if (!currentUser) {
      return
    }
    this.loadData()
  },

  async loadData() {
    try {
      const list = (await getConsumables()).map(normalizeConsumable)
      const lowStockList = list.filter((item) => item.isLowStock)
      const currentId = this.data.operationForm.consumableId || (list[0] && list[0].id) || ''
      const operationTarget = list.find((item) => item.id === currentId) || list[0] || null
      const operationIndex = Math.max(list.findIndex((item) => item.id === (operationTarget && operationTarget.id)), 0)

      this.setData({
        list,
        lowStockList,
        stats: buildStats(list),
        operationTarget,
        operationIndex,
        operationForm: {
          ...this.data.operationForm,
          consumableId: operationTarget ? operationTarget.id : ''
        }
      }, () => {
        if (this.data.operationMode === 'stocktake' && operationTarget && !this.data.operationForm.quantity) {
          this.setData({
            'operationForm.quantity': `${operationTarget.stock}`
          }, () => {
            this.refreshOperationMeta()
          })
        } else {
          this.refreshOperationMeta()
        }
        this.applyFilter()
      })
    } catch (error) {
      wx.showToast({ title: error.message || '加载耗材失败', icon: 'none' })
    }
  },

  applyFilter() {
    const { list, activeFilter } = this.data
    const filteredList = list.filter((item) => {
      if (activeFilter === 'warning') {
        return item.isLowStock
      }
      if (activeFilter === 'normal') {
        return !item.isLowStock
      }
      if (activeFilter === 'empty') {
        return item.isEmptyStock
      }
      return true
    })
    this.setData({ filteredList })
  },

  refreshOperationMeta() {
    this.setData({
      operationMeta: buildOperationMeta(
        this.data.operationMode,
        this.data.operationTarget,
        this.data.operationForm.quantity
      )
    })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleOperationInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`operationForm.${field}`]: event.detail.value
    }, () => {
      this.refreshOperationMeta()
    })
  },

  changeFilter(event) {
    this.setData({
      activeFilter: event.currentTarget.dataset.filter
    }, () => {
      this.applyFilter()
    })
  },

  changeMode(event) {
    const mode = event.currentTarget.dataset.mode
    this.prepareOperation(mode, this.data.operationTarget ? this.data.operationTarget.id : '')
  },

  changeOperationTarget(event) {
    const operationIndex = Number(event.detail.value)
    const operationTarget = this.data.list[operationIndex] || null
    const nextQuantity = this.data.operationMode === 'stocktake' && operationTarget
      ? `${operationTarget.stock}`
      : ''

    this.setData({
      operationIndex,
      operationTarget,
      operationForm: {
        consumableId: operationTarget ? operationTarget.id : '',
        quantity: nextQuantity
      }
    }, () => {
      this.refreshOperationMeta()
    })
  },

  prepareOperation(mode, id) {
    const operationTarget = this.data.list.find((item) => item.id === id) || this.data.list[0] || null
    const operationIndex = Math.max(this.data.list.findIndex((item) => item.id === (operationTarget && operationTarget.id)), 0)
    const quantity = mode === 'stocktake' && operationTarget ? `${operationTarget.stock}` : ''

    this.setData({
      operationMode: mode,
      operationTarget,
      operationIndex,
      operationForm: {
        consumableId: operationTarget ? operationTarget.id : '',
        quantity
      }
    }, () => {
      this.refreshOperationMeta()
    })
  },

  openQuickAction(event) {
    this.prepareOperation(event.currentTarget.dataset.mode, event.currentTarget.dataset.id)
  },

  editItem(event) {
    const id = event.currentTarget.dataset.id
    const target = this.data.list.find((item) => item.id === id)
    if (!target) {
      return
    }
    this.setData({
      operationMode: 'catalog',
      form: {
        id: target.id,
        name: target.name,
        category: target.category,
        unit: target.unit,
        stock: `${target.stock}`,
        warningValue: `${target.warningValue}`
      }
    }, () => {
      this.refreshOperationMeta()
    })
  },

  resetForm() {
    this.setData({
      form: createEmptyForm()
    })
  },

  resetOperation() {
    this.prepareOperation(this.data.operationMode, this.data.operationTarget ? this.data.operationTarget.id : '')
  },

  async submit() {
    try {
      await saveConsumable(this.data.form)
      wx.showToast({ title: this.data.form.id ? '库存已更新' : '耗材已新增', icon: 'success' })
      this.resetForm()
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  async submitOperation() {
    const { operationMode, operationTarget, operationForm } = this.data
    if (!operationTarget) {
      wx.showToast({ title: '请先选择耗材', icon: 'none' })
      return
    }

    const quantity = Number(operationForm.quantity)
    if (!Number.isInteger(quantity) || quantity < 0) {
      wx.showToast({ title: operationMode === 'stocktake' ? '盘点库存需为不小于 0 的整数' : '请输入有效数量', icon: 'none' })
      return
    }
    if (operationMode !== 'stocktake' && quantity <= 0) {
      wx.showToast({ title: '数量需大于 0', icon: 'none' })
      return
    }
    if (operationMode === 'outbound' && quantity > operationTarget.stock) {
      wx.showToast({ title: '出库数量不能超过当前库存', icon: 'none' })
      return
    }

    let nextStock = operationTarget.stock
    let successText = '库存已更新'
    if (operationMode === 'inbound') {
      nextStock = operationTarget.stock + quantity
      successText = '入库成功'
    } else if (operationMode === 'outbound') {
      nextStock = operationTarget.stock - quantity
      successText = '出库成功'
    } else if (operationMode === 'stocktake') {
      nextStock = quantity
      successText = '盘点完成'
    }

    try {
      await saveConsumable({
        id: operationTarget.id,
        name: operationTarget.name,
        category: operationTarget.category,
        unit: operationTarget.unit,
        stock: nextStock,
        warningValue: operationTarget.warningValue
      })
      wx.showToast({ title: successText, icon: 'success' })
      this.prepareOperation(operationMode, operationTarget.id)
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }
})
