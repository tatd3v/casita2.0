<script lang="ts">
  export let isOpen = false;
  export let title: string;
  export let message: string;
  export let confirmText: string;
  export let cancelText: string;
  export let onConfirm: () => void;
  export let onCancel: () => void;

  const handleConfirm = () => {
    onConfirm();
    isOpen = false;
  };

  const handleCancel = () => {
    onCancel();
    isOpen = false;
  };

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  };
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal">
      <div class="modal-header">
        <h3>{title}</h3>
      </div>
      
      <div class="modal-body">
        <p>{message}</p>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" on:click={handleCancel}>
          {cancelText}
        </button>
        <button class="btn-confirm" on:click={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 44, 25, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 200ms ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal {
    background: var(--color-ivory);
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 2rem 4rem rgba(15, 44, 25, 0.3);
    animation: slideUp 250ms ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    margin-bottom: 1.5rem;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-slate-dark);
    text-align: center;
  }

  .modal-body {
    margin-bottom: 2rem;
  }

  .modal-body p {
    margin: 0;
    font-size: 1rem;
    color: var(--color-slate);
    text-align: center;
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-cancel,
  .btn-confirm {
    border: none;
    border-radius: 0.75rem;
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
    font-family: inherit;
    min-width: 120px;
  }

  .btn-cancel {
    background: rgba(168, 138, 237, 0.1);
    color: var(--color-indigo-dark);
    border: 2px solid rgba(168, 138, 237, 0.2);
  }

  .btn-cancel:hover {
    background: rgba(168, 138, 237, 0.2);
    border-color: rgba(168, 138, 237, 0.3);
  }

  .btn-confirm {
    background: linear-gradient(
      145deg,
      var(--color-pear),
      var(--color-pear-dark)
    );
    color: var(--color-slate-dark);
    border: 2px solid transparent;
  }

  .btn-confirm:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(203, 216, 59, 0.3);
  }

  @media (max-width: 768px) {
    .modal {
      padding: 1.5rem;
      max-width: 340px;
    }

    .modal-header h3 {
      font-size: 1.25rem;
    }

    .modal-body p {
      font-size: 0.95rem;
    }

    .modal-footer {
      flex-direction: column-reverse;
      gap: 0.75rem;
    }

    .btn-cancel,
    .btn-confirm {
      width: 100%;
      padding: 1rem;
    }
  }
</style>
