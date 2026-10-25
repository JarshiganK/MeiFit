import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { Card } from '../../ui'

/** Mirrors PRIVACY.md (tests/privacy.test.ts keeps them identical). */
export function PrivacyScreen() {
  return (
    <>
      <ScreenHeader title={en.privacy.title} backTo="/settings" />
      <div className="flex flex-col gap-4 pt-2">
        {en.privacy.sections.map((section) => (
          <Card key={section.title} title={section.title}>
            <div className="flex flex-col gap-3 text-sm text-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {'bullets' in section && (
                <ul className="flex list-disc flex-col gap-2 pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
