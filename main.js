document.addEventListener('DOMContentLoaded', event => {
    const editor = new TextEditor('#editor', window.localforage)
})


class TextEditor {
    constructor (editorId, db) {
        this.editor = document.querySelector(editorId)
        this.lastSave = document.querySelector('#last-save')
        this.bindUI()

        this.db = db
        this.init()
    }

    init () {
        this.db.config({
            name: 'Tab Typer',
            storeName: 'tab_typer',
            description: 'A simple text editor for your browser.'
        })

        this.db.getItem('file')
                .then(f => this.showFile(f))
                .catch(this.handleError)
    }

    showFile (file) {
        if (file) {
            this.editor.value = file.content
            this.lastSave.innerText = this.getSaveTimeString(file.lastSave)
        }
    }

    saveFile () {
        const file = {
            content: this.editor.value,
            lastSave: new Date().toLocaleTimeString()
        }
        this.db.setItem('file', file)
            .then(f => this.updateSaveTime(f))
            .catch(this.handleError)
    }

    updateSaveTime (file) {
        this.lastSave.innerText = this.getSaveTimeString(file.lastSave)
    }

    getSaveTimeString (time) {
        return 'Last save at ' + time
    }

    handleError (error) {
        console.error(error)
    }

    updateEditorHeight () {
        // Make editor content fit without a scrollbar.
        this.editor.style.height = '1px'
        this.editor.style.height = this.editor.scrollHeight + 2 + 'px'
    }

    bindUI () {
        // Save 2 seconds after the user stops typing.
        this.editor.addEventListener('keyup', Helpers.debounce(() => this.saveFile(), 2000))

        this.editor.addEventListener('input', event => this.updateEditorHeight())
        this.updateEditorHeight()
        this.editor.placeholder = `Hey there!\n\nThis is a simple text editor for your browser. Files are automatically saved and stored locally on your device.`
        this.editor.focus()
    }
}

const Helpers = {
    debounce: (callback, time) => {
        // Classic helper method: Prevent `callback` from executing more often than `time`.
        let timeout
        return function () {
            const caller = () => callback.apply(this, arguments)
            clearTimeout(timeout)
            timeout = setTimeout(caller, time)
        }
    }
}
