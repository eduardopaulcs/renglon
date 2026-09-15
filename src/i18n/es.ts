/**
 * Spanish strings. This is the reference dictionary: `en.ts` is typed against its keys, so a
 * string added here without its English counterpart fails the typecheck.
 *
 * Copy avoids second-person verbs where possible, so it reads naturally for both "tú" and
 * "vos" speakers.
 */
export const es = {
  'app.name': 'Renglón',
  'db.error': 'No se pudo preparar la base de datos',

  'common.cancel': 'Cancelar',
  'common.create': 'Crear',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.rename': 'Renombrar',
  'common.undo': 'Deshacer',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.more': 'Más opciones',
  'common.failed': 'No se pudo completar la operación.',

  'nav.openMenu': 'Abrir menú',
  'nav.allNotes': 'Todas las notas',
  'nav.folders': 'Carpetas',
  'nav.tags': 'Etiquetas',
  'nav.trash': 'Papelera',
  'nav.backup': 'Respaldo',
  'nav.newFolder': 'Nueva carpeta',
  'nav.newTag': 'Nueva etiqueta',
  'nav.noFolders': 'Sin carpetas',
  'nav.noTags': 'Sin etiquetas',

  'notes.search': 'Buscar en las notas',
  'notes.new': 'Nueva nota',
  'notes.untitled': 'Sin título',
  'notes.pinned': 'Fijada',
  'notes.empty': 'Todavía no hay notas.',
  'notes.emptyFolder': 'Esta carpeta no tiene notas.',
  'notes.emptyTag': 'Ninguna nota tiene esta etiqueta.',
  'notes.emptyHint': 'El botón + crea una nota nueva.',
  'notes.noResults': 'Ninguna nota coincide con la búsqueda.',
  'notes.deleteSelected': 'Eliminar seleccionadas',
  'notes.clearSelection': 'Cancelar selección',
  'notes.selected_one': '{count} seleccionada',
  'notes.selected_other': '{count} seleccionadas',
  'notes.trashed_one': 'Nota enviada a la papelera',
  'notes.trashed_other': '{count} notas enviadas a la papelera',

  'editor.titlePlaceholder': 'Título',
  'editor.bodyPlaceholder': 'Escribir…',
  'editor.saved': 'Nota guardada',
  'editor.discarded': 'Nota vacía descartada',
  'editor.pin': 'Fijar',
  'editor.unpin': 'Desfijar',
  'editor.preview': 'Vista previa',
  'editor.edit': 'Editar',
  'editor.tags': 'Etiquetas',
  'editor.folder': 'Carpeta',
  'editor.share': 'Compartir como Markdown',
  'editor.delete': 'Eliminar nota',
  'editor.noFolder': 'Sin carpeta',
  'editor.addTags': 'Agregar etiquetas',
  'editor.edited': 'Editada {date}',
  'editor.previewEmpty': 'Nada para mostrar todavía.',

  'format.bold': 'Negrita',
  'format.italic': 'Cursiva',
  'format.heading': 'Título',
  'format.bullet': 'Lista',
  'format.numbered': 'Lista numerada',
  'format.checkbox': 'Casilla',
  'format.quote': 'Cita',

  'folders.new': 'Nueva carpeta',
  'folders.rename': 'Renombrar carpeta',
  'folders.delete': 'Eliminar carpeta',
  'folders.deleteConfirm': 'Se eliminará la carpeta «{name}». Sus notas no se borran: quedan sin carpeta.',
  'folders.namePlaceholder': 'Nombre de la carpeta',
  'folders.pick': 'Mover a carpeta',

  'tags.new': 'Nueva etiqueta',
  'tags.rename': 'Renombrar etiqueta',
  'tags.delete': 'Eliminar etiqueta',
  'tags.deleteConfirm': 'Se quitará la etiqueta «{name}» de todas las notas. Las notas no se borran.',
  'tags.namePlaceholder': 'Nombre de la etiqueta',
  'tags.pick': 'Etiquetas',
  'tags.createInline': 'Crear «{name}»',
  'tags.none': 'Todavía no hay etiquetas.',
  'tags.nameTaken': 'Ya existe una etiqueta con ese nombre.',

  'trash.empty': 'La papelera está vacía.',
  'trash.emptyAction': 'Vaciar papelera',
  'trash.emptyConfirm_one': 'Se eliminará {count} nota para siempre. No se puede deshacer.',
  'trash.emptyConfirm_other': 'Se eliminarán {count} notas para siempre. No se puede deshacer.',
  'trash.restore': 'Restaurar',
  'trash.deleteForever': 'Eliminar para siempre',
  'trash.deleteForeverConfirm': 'La nota se eliminará para siempre. No se puede deshacer.',
  'trash.restored_one': 'Nota restaurada',
  'trash.restored_other': '{count} notas restauradas',
  'trash.deleted_one': 'Nota eliminada para siempre',
  'trash.deleted_other': '{count} notas eliminadas para siempre',
  'trash.deletedOn': 'Eliminada {date}',

  'backup.exportTitle': 'Exportar',
  'backup.exportBody':
    'Genera un archivo con todas las notas, carpetas y etiquetas, para guardarlo donde se prefiera.',
  'backup.exportAction': 'Exportar respaldo',
  'backup.importTitle': 'Importar',
  'backup.importBody':
    'Recupera notas desde un respaldo. Las notas actuales se conservan; si el respaldo trae una versión más reciente de una nota, la reemplaza.',
  'backup.importAction': 'Elegir archivo',
  'backup.imported': 'Respaldo importado: {created} nuevas, {updated} actualizadas.',
  'backup.invalid': 'El archivo no es un respaldo válido de Renglón.',
  'backup.shareDialog': 'Guardar respaldo',

  'date.yesterday': 'ayer',
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof es;

/** Keys that exist as a `_one`/`_other` pair, referenced by their shared base name. */
export type PluralKey = TranslationKey extends infer K ? (K extends `${infer Base}_one` ? Base : never) : never;
