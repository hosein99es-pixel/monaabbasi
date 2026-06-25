import type {NavbarProps} from 'sanity'

// A larger, branded header band sits above Sanity's default navbar. It gives the
// editor a clear sense of place (whose site this is), a plain-language reminder
// of how publishing works — in English and Persian — and a one-tap link to view
// the live website. The default navbar (search, workspace menu, etc.) is rendered
// underneath untouched.
const websiteUrl = process.env.SANITY_STUDIO_WEBSITE_ORIGIN || 'https://fatemeabbasi.netlify.app'

export function StudioNavbar(props: NavbarProps) {
  return (
    <div className="mona-navbar">
      <div className="mona-brandband">
        <div className="mona-brandband__title">
          <strong>Fateme Abbasi</strong>
          <span> — content studio · استودیوی محتوا</span>
        </div>
        <div className="mona-brandband__hint">
          Edit anything, then press the green <b>Publish</b> button at the bottom to update the
          website. · هر چیزی را ویرایش کنید و برای انتشار، دکمهٔ سبز <b>Publish</b> در پایین صفحه را
          بزنید.
        </div>
        <a className="mona-brandband__link" href={websiteUrl} target="_blank" rel="noreferrer">
          View website · مشاهدهٔ سایت ↗
        </a>
      </div>
      {props.renderDefault(props)}
    </div>
  )
}
