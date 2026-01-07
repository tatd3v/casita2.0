import type { AppCopy, Locale } from './types'

export const COPIES: Record<Locale, AppCopy> = {
  es: {
    hero: {
      eyebrow: 'Muchu & Apolo · Casita2.0',
      title: 'Control de Comida ',
      lead: 'Marca quién alimentó a los peques en la mañana y en la tarde para evitar duplicados y mantener a toda la casita sincronizada.',
    },
    general: {
      fallbackCaretaker: 'Comunidad',
      languageName: 'Español',
      toggleLabel: 'English',
      resetButton: 'Reiniciar día',
    },
    card: {
      slotLabels: {
        morning: 'Mañana',
        evening: 'Tarde',
      },
      badge: {
        done: '¡Listo!',
        pending: 'Pendiente',
      },
      description: {
        done: (caretaker: string) => `Alimentado por ${caretaker}`,
        pending: 'Marca cuando este turno quede cubierto',
        fallbackName: 'alguien',
      },
      caretakerLabel: '¿Quién alimentó?',
      placeholder: 'Selecciona un nombre',
      otherOption: 'Otro...',
      ariaLabel: (slotLabel: string) =>
        `Nombre de quien alimentó turno ${slotLabel}`,
      button: {
        done: 'Revertir',
        pending: 'Marcar como alimentado',
      },
    },
    history: {
      title: 'Historial',
      subtitleEmpty: 'Aún no hay registros hoy',
      emptyMessage: 'Cuando alguien marque un turno, se verá aquí.',
      slotLabels: {
        morning: 'Mañana',
        evening: 'Tarde',
      },
    },
  },
  en: {
    hero: {
      eyebrow: 'Muchu & Apolo · Casita2.0',
      title: 'Daily feeding tracker',
      lead: 'Mark who fed the cats in the morning and evening to avoid double servings and keep everyone aligned.',
    },
    general: {
      fallbackCaretaker: 'Community',
      languageName: 'English',
      toggleLabel: 'Español',
      resetButton: 'Reset day',
    },
    card: {
      slotLabels: {
        morning: 'Morning',
        evening: 'Evening',
      },
      badge: {
        done: 'Done!',
        pending: 'Pending',
      },
      description: {
        done: (caretaker: string) => `Fed by ${caretaker}`,
        pending: 'Mark this slot once it is covered',
        fallbackName: 'someone',
      },
      caretakerLabel: 'Who fed?',
      placeholder: 'Select a name',
      otherOption: 'Other...',
      ariaLabel: (slotLabel: string) =>
        `Name of who fed during ${slotLabel} slot`,
      button: {
        done: 'Undo',
        pending: 'Mark as fed',
      },
    },
    history: {
      title: 'History',
      subtitleEmpty: 'No records for today yet',
      emptyMessage: 'Once someone marks a slot, you will see it here.',
      slotLabels: {
        morning: 'Morning',
        evening: 'Evening',
      },
    },
  },
};
