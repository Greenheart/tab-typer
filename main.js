document.addEventListener('DOMContentLoaded', event => {
    const editor = document.querySelector('#editor')
    editor.placeholder = `Hey there!\n\nThis is a simple text editor for your browser. Files are automatically saved and stored locally on your device.`

    function updateEditorHeight () {
        editor.style.height = '1px'
        editor.style.height = editor.scrollHeight + 2 + 'px'
    }

    editor.addEventListener('input', event => {
        event.preventDefault()
        updateEditorHeight()
    })

    editor.focus()
    updateEditorHeight()
})
