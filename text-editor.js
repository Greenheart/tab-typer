class TextEditor {
    constructor (editorId, db) {
        this.editor = document.querySelector(editorId)
        this.lastSave = document.querySelector('#last-save')
        this.fileList = document.querySelector('#file-list')
        this.newFileButton = document.querySelector('#new')
        this.bindUI()

        this.files = []
        this.openFile = null
        this.db = db
        this.init()

        if (window.DEBUG) {
            window.c = () => {
                localforage.clear()
                this.files = []
                this.fileList.innerHTML = ''
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
            const lastEdited = files.reduce((lastEdited, file) => {
                if (file.time > lastEdited.time) return file
                return lastEdited
            })

            this.showFile(lastEdited)
            this.openFile = lastEdited
        }
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

        if (window.DEBUG !== true) {
            // Save before tab is closed.
            window.addEventListener('beforeunload', () => this.saveAllFiles())
        }

        this.newFileButton.addEventListener('click', () => {
            this.files.push(this.createFile())
            this.showLastEdited(this.files)
            this.listFiles(this.files)
            this.saveAllFiles()
        })
    }
}
