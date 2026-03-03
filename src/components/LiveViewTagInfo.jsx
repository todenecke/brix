import { STEINE_CONFIG } from '../config/brixConfig'
import './LiveViewTagInfo.css'

function getFarbeForTagId(tagId) {
  return STEINE_CONFIG.find((s) => s.tagId === tagId)?.farbe ?? null
}

export default function LiveViewTagInfo({ detectedTags = [] }) {
  return (
    <div className="live-view-tag-info">
      {detectedTags.length > 0 ? (
        [...detectedTags]
          .sort((a, b) => (a.center?.y ?? 0) - (b.center?.y ?? 0))
          .map((t) => {
            const farbe = getFarbeForTagId(t.tagId)
            return (
              <span key={t.tagId} className="live-view-tag-info__item">
                ID{t.tagId}{farbe ? ` / ${farbe}` : ''}
              </span>
            )
          })
      ) : (
        <span className="live-view-tag-info__item">–</span>
      )}
    </div>
  )
}
