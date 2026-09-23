import { useState, type FormEvent } from "react";
import { HAIR_OPTIONS, type Hair, type Profile } from "@nook/shared";
import { createProfile } from "../api/profiles";
import { storeSession } from "../session/session";

/** Hair choices offered on the form, including "no hair". `null` = bald. */
const HAIR_CHOICES: { value: Hair | null; label: string }[] = [
  ...HAIR_OPTIONS.map((value) => ({
    value,
    // "shorthair" -> "Short", "longhair" -> "Long".
    label: value.replace(/hair$/, "").replace(/^\w/, (c) => c.toUpperCase()),
  })),
  { value: null, label: "None" },
];

const MAX_NAME_LENGTH = 32; // matches the profiles table's display_name column

/**
 * First-run onboarding: the player picks a display name and a look, which are
 * persisted as their {@link Profile}. React owns this (application UI), keeping
 * it out of the Phaser world; the world only starts once a profile exists.
 *
 * This is the password-less identity slice — no accounts yet. `onComplete` hands
 * the created profile up so the shell can start the world with it.
 */
export function Onboarding({
  onComplete,
}: {
  onComplete: (profile: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [hair, setHair] = useState<Hair | null>(HAIR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = displayName.trim();
  const canSubmit = trimmedName !== "" && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile = await createProfile({
        displayName: trimmedName,
        appearance: hair ? { hair } : {},
      });
      storeSession(profile);
      onComplete(profile);
    } catch {
      setError("Couldn't create your profile. Is the server running?");
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding">
      <form className="onboarding__card" onSubmit={handleSubmit}>
        <h1 className="onboarding__title">Welcome to Nook</h1>
        <p className="onboarding__subtitle">
          A cozy place to work and hang out. Set up how you'll appear.
        </p>

        <label className="onboarding__label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="onboarding__input"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Robin"
          autoFocus
        />

        <span className="onboarding__label">Hair</span>
        <div className="onboarding__options" role="radiogroup" aria-label="Hair">
          {HAIR_CHOICES.map((choice) => (
            <button
              key={choice.label}
              type="button"
              role="radio"
              aria-checked={hair === choice.value}
              className={
                "onboarding__option" +
                (hair === choice.value ? " onboarding__option--selected" : "")
              }
              onClick={() => setHair(choice.value)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        {error && <p className="onboarding__error">{error}</p>}

        <button
          type="submit"
          className="onboarding__submit"
          disabled={!canSubmit}
        >
          {submitting ? "Entering…" : "Enter Nook"}
        </button>
      </form>
    </div>
  );
}
