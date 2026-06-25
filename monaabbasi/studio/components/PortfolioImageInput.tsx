import {DownloadIcon, LinkIcon, TrashIcon, UploadIcon} from '@sanity/icons'
import {Box, Button, Flex, useToast} from '@sanity/ui'
import {type ChangeEvent, useCallback, useRef, useState} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset, useClient} from 'sanity'

// Surfaces the image actions that Sanity normally hides behind the "…" menu as
// always-visible buttons under the preview. The default image input is still
// rendered (so Crop & hotspot, drag-drop, and the native menu all keep working);
// these buttons are a convenience layer on top, so there is no loss of function
// if a custom action ever misbehaves.
const PROJECT_ID = 'esf8v11h'

type ImageValue = {asset?: {_ref?: string}}

function assetRefToUrl(ref: string | undefined, dataset: string): string | null {
  if (!ref) return null
  const match = /^image-([a-f\d]+)-(\d+x\d+)-(\w+)$/.exec(ref)
  if (!match) return null
  const [, id, dimensions, ext] = match
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${dataset}/${id}-${dimensions}.${ext}`
}

export function PortfolioImageInput(props: ObjectInputProps) {
  const {onChange, value} = props
  const client = useClient({apiVersion: '2026-06-22'})
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const dataset = client.config().dataset || 'production'
  const assetRef = (value as ImageValue | undefined)?.asset?._ref
  const url = assetRefToUrl(assetRef, dataset)

  const handleUpload = useCallback(
    async (file: File) => {
      setBusy(true)
      try {
        const asset = await client.assets.upload('image', file)
        onChange([
          setIfMissing({_type: 'image'}),
          set({_type: 'reference', _ref: asset._id}, ['asset']),
        ])
        toast.push({status: 'success', title: 'Image uploaded · تصویر بارگذاری شد'})
      } catch {
        toast.push({status: 'error', title: 'Upload failed · بارگذاری ناموفق بود'})
      } finally {
        setBusy(false)
      }
    },
    [client, onChange, toast],
  )

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) void handleUpload(file)
      event.target.value = ''
    },
    [handleUpload],
  )

  const copyUrl = useCallback(() => {
    if (!url) return
    void navigator.clipboard.writeText(url)
    toast.push({status: 'success', title: 'URL copied · نشانی کپی شد'})
  }, [url, toast])

  const downloadImage = useCallback(() => {
    if (url) window.open(url, '_blank', 'noopener')
  }, [url])

  const clearField = useCallback(() => {
    onChange(unset())
  }, [onChange])

  return (
    <Box>
      {props.renderDefault(props)}
      <Flex gap={2} wrap="wrap" marginTop={3}>
        <Button
          text="Upload / Replace · بارگذاری"
          icon={UploadIcon}
          mode="ghost"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        />
        <Button
          text="Copy URL · کپی نشانی"
          icon={LinkIcon}
          mode="ghost"
          disabled={!url}
          onClick={copyUrl}
        />
        <Button
          text="Download · دانلود"
          icon={DownloadIcon}
          mode="ghost"
          disabled={!url}
          onClick={downloadImage}
        />
        <Button
          text="Clear field · حذف"
          icon={TrashIcon}
          mode="ghost"
          tone="critical"
          disabled={!assetRef}
          onClick={clearField}
        />
      </Flex>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={onFileChange}
      />
    </Box>
  )
}
