// ----- 1. 定义扩展 tokenizer / 解析器 -----
// 扩展名称: 'componentBlock'
// 匹配以 ::: component-name 开头，以 ::: 结束的区块 (允许中间有换行)
export const customComponentExtension = {
  name: 'componentBlock',
  level: 'block', // 块级扩展

  // 检测开始: 匹配 ::: component-name 并捕获内容直到结束标记 :::
  start(src: string) {
    // 查找 :: component-name 出现的位置 (不区分大小写? 这里精确匹配小写，但用户常写小写)
    // 同时支持多个空格: :::   component-name
    const match = src.match(/^:::\s*([\w-]+)\s*$/m)
    return match ? match.index : undefined
  },

  // tokenizer: 解析自定义块
  tokenizer(src: string, tokens: any[]) {
    // 匹配整个块:
    // - 开头 ::: component-name (可能后面有空格)
    // - 中间任意内容(包括换行)，直到遇到独立一行的 :::
    // - 结束标记 ::: 可以前面有空格, 保证独占一行
    const rule = /^:::\s*([\w-]+)\s*\n([\s\S]*?)\n\s*:::\s*(?:\n|$)/
    const match = rule.exec(src)
    if (match) {
      const componentName = match[1] // 组件名称
      const rawContent = match[2] // 中间的配置文本
      return {
        type: 'componentBlock',
        componentName,
        raw: match[0], // 完整的原始文本
        content: rawContent.trim(), // 去除首尾空白
        tokens: [] // 不需要嵌套解析
      }
    }
    return undefined
  },

  renderer(token: any) {
    const { content, componentName } = token // 例如 "title: 自定义节点\nsubtitle: ...\nbtn(value1): 确认..."
    const lines = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    // 解析数据: title, subtitle, btn(...)
    let title = ''
    let subtitle = ''
    const buttons = [] // 存储 { key, label }

    for (const line of lines) {
      // 匹配 title: xxx  (允许冒号后有空格)
      const titleMatch = line.match(/^title\s*:\s*(.*)$/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
        continue
      }
      // 匹配 subtitle: xxx
      const subtitleMatch = line.match(/^subtitle\s*:\s*(.*)$/i)
      if (subtitleMatch) {
        subtitle = subtitleMatch[1].trim()
        continue
      }
      // 匹配 btn(value1): 确认  / btn(value2): 取消 等
      // 格式: btn(任意标识): 文字
      const btnMatch = line.match(/^btn\s*\(\s*([^)]+)\s*\)\s*:\s*(.*)$/i)
      if (btnMatch) {
        const key = btnMatch[1].trim() // 如 value1
        const label = btnMatch[2].trim() // 如 确认
        buttons.push({ key, label })
        continue
      }
      // 其他行忽略 (也可以选择追加到某个字段, 但按需忽略)
    }

    const payload = JSON.stringify({ title, subtitle, buttons })
    // 把组件名写进 data-component，供 Vue 动态解析
    return `<div class="vue-component-slot" 
      data-component="${componentName}" 
      data-props='${payload}'
    >${content}</div>
    `
  }
}
