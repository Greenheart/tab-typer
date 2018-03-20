document.addEventListener('DOMContentLoaded', event => {
    const editor = new TextEditor('#editor', window.localforage)
})


class TextEditor {
    constructor (editorId, db) {
        this.editor = document.querySelector(editorId)
        this.lastSave = document.querySelector('#last-save')
        this.fileList = document.querySelector('#file-list')
        this.bindUI()

        this.files = []
        this.openFile = null
        this.db = db
        this.init()

        window.DEBUG = true
        if (window.DEBUG) {
            window.c = () => {
                localforage.clear()
                this.files = []
            }
        }
    }

    init () {
        this.db.config({
            name: 'Tab Typer',
            storeName: 'tab_typer',
            description: 'A simple text editor for your browser.'
        })

        this.db.getItem('files')
            .then(files => {
                if (files && files.length > 0) {
                    console.info('Loaded files: ', files)
                    this.files = files
                } else {
                    this.files.push(this.createFile())
                    console.info('Starting with blank file: ', this.files)
                }

                return this.files
            })
            .then(files => {
                this.listFiles(files)
                return files
            })
            .then(files => {
                this.showLastEdited(files)
                return files
            })
            .catch(this.handleError)
    }

    createFile (name = 'Untitled') {
        const date = new Date()
        return {
            name,
            content: '',
            // TODO: Save files with only the unix timestamp, the string can be retrieved when needed.
            // store in `lastSave` to clarify meaning of the timestamp.
            lastSave: date.toLocaleTimeString(),
            time: date.getTime(),
            id: Helpers.uuidv4()
        }
    }

    listFiles (files) {
        this.fileList.innerHTML = files.map(f => `<li>${f.name}</li>`).join('')
    }

    showFile (file) {
        if (file) {
            this.editor.value = file.content
            this.lastSave.innerText = this.getSaveTimeString(file.lastSave)
        }
    }

    showLastEdited (files) {
        if (files) {
            this.showFile(files[0])
            this.openFile = files[0]
        }

        // TODO: Show the last edited file.
        // const lastEdited = files.reduce((lastEdited, file) => {
        //     if (file.time > lastEdited.time) return file
        //     return lastEdited
        // }, { time: 0, content: '', lastSave: '' })
    }

    saveAllFiles () {
        const date = new Date()
        const files = this.files.map(f => {
            if (f === this.openFile) {
                f.content = this.editor.value,
                f.lastSave = date.toLocaleTimeString(),
                f.time = date.getTime()
            }
            return f
        })

        this.db.setItem('files', files)
            .then(files => this.updateSaveTime(files))
            .catch(this.handleError)
    }

    updateSaveTime (files) {
        this.lastSave.innerText = this.getSaveTimeString(this.openFile.lastSave)
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
        this.editor.addEventListener('keyup', Helpers.debounce(() => this.saveAllFiles(), 2000))

        this.editor.addEventListener('input', event => this.updateEditorHeight())
        this.updateEditorHeight()
        this.editor.placeholder = `Hey there!\n\nThis is a simple, offline-first text editor for your browser. Files are automatically saved as you type, and stored locally on your device.`
        this.editor.focus()

        if (!window.DEBUG) {
            // Save before tab is closed.
            window.addEventListener('beforeunload', () => this.saveAllFiles())
        }
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
    },
    // Credit: https://stackoverflow.com/a/2117523
    uuidv4 () {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    }
}
