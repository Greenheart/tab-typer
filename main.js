document.addEventListener('DOMContentLoaded', event => {
    const editor = new TextEditor('#editor')
})


class TextEditor {
    constructor (editorId) {
        this.editor = document.querySelector(editorId)
        this.editor.placeholder = `Hey there!\n\nThis is a simple text editor for your browser. Files are automatically saved and stored locally on your device.`

        this.bindUI()
        this.updateEditorHeight()
        this.editor.focus()
    }

    updateEditorHeight () {
        this.editor.style.height = '1px'
        this.editor.style.height = this.editor.scrollHeight + 2 + 'px'
    }

    bindUI () {
        this.editor.addEventListener('input', event => {
            event.preventDefault()
            updateEditorHeight()
        })
    }
}
