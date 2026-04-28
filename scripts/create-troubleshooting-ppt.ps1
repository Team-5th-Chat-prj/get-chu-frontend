$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "artifacts"
$tmpDir = Join-Path $outDir "pptx-build"
$pptxPath = Join-Path $outDir "e2e-troubleshooting-slide.pptx"
$zipPath = Join-Path $outDir "e2e-troubleshooting-slide.zip"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
if (Test-Path $tmpDir) { Remove-Item -Recurse -Force $tmpDir }
if (Test-Path $pptxPath) { Remove-Item -Force $pptxPath }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

@(
  "_rels",
  "docProps",
  "ppt",
  "ppt\_rels",
  "ppt\slides",
  "ppt\slides\_rels",
  "ppt\slideMasters",
  "ppt\slideMasters\_rels",
  "ppt\slideLayouts",
  "ppt\slideLayouts\_rels",
  "ppt\theme"
) | ForEach-Object {
  New-Item -ItemType Directory -Force -Path (Join-Path $tmpDir $_) | Out-Null
}

function Write-Utf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Escape-Xml {
  param([string]$Value)

  return [System.Security.SecurityElement]::Escape($Value)
}

function New-TextShape {
  param(
    [int]$Id,
    [string]$Name,
    [int]$X,
    [int]$Y,
    [int]$Cx,
    [int]$Cy,
    [int]$TitleSize,
    [string]$TitleColor,
    [string]$Heading,
    [int]$BodySize,
    [string]$BodyColor,
    [string[]]$BodyLines
  )

  $heading = Escape-Xml $Heading
  $bodyParagraphs = ($BodyLines | ForEach-Object {
    $line = Escape-Xml $_
    @"
      <a:p>
        <a:r>
          <a:rPr lang="ko-KR" sz="$BodySize" dirty="0" smtClean="0">
            <a:solidFill><a:srgbClr val="$BodyColor"/></a:solidFill>
            <a:latin typeface="Malgun Gothic"/>
            <a:ea typeface="Malgun Gothic"/>
          </a:rPr>
          <a:t>$line</a:t>
        </a:r>
      </a:p>
"@
  }) -join "`r`n"

  return @"
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="$Id" name="$Name"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="$X" y="$Y"/>
          <a:ext cx="$Cx" cy="$Cy"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="45720" tIns="45720" rIns="45720" bIns="45720"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="ko-KR" sz="$TitleSize" b="1" dirty="0" smtClean="0">
              <a:solidFill><a:srgbClr val="$TitleColor"/></a:solidFill>
              <a:latin typeface="Malgun Gothic"/>
              <a:ea typeface="Malgun Gothic"/>
            </a:rPr>
            <a:t>$heading</a:t>
          </a:r>
        </a:p>
$bodyParagraphs
      </p:txBody>
    </p:sp>
"@
}

$titleShape = @"
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="2" name="Title"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="457200" y="228600"/>
          <a:ext cx="11277600" cy="685800"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="ko-KR" sz="2600" b="1" dirty="0" smtClean="0">
              <a:solidFill><a:srgbClr val="2B2B2B"/></a:solidFill>
              <a:latin typeface="Malgun Gothic"/>
              <a:ea typeface="Malgun Gothic"/>
            </a:rPr>
            <a:t>E2E 도입으로 해결한 로컬 환경 차이 문제</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>
"@

$problemShape = New-TextShape -Id 3 -Name "Problem" -X 548640 -Y 1143000 -Cx 5029200 -Cy 2103120 -TitleSize 1800 -TitleColor "FF7A1A" -Heading "문제 상황" -BodySize 1200 -BodyColor "333333" -BodyLines @(
  "• 내 로컬에서는 정상이지만 팀원 환경에서는 통합 흐름이 동일하게 재현되지 않았습니다.",
  "• docker-compose.yml 의 restart: unless-stopped 설정으로 백엔드 오류가 무한 재시도로 숨겨졌습니다.",
  "• 팀원 환경에서는 더미 데이터 주입이 누락되어 로그인·시드 화면이 정상 동작하지 않는 경우가 있었습니다."
)

$causeShape = New-TextShape -Id 4 -Name "Cause" -X 548640 -Y 3657600 -Cx 5029200 -Cy 1645920 -TitleSize 1800 -TitleColor "FF7A1A" -Heading "원인" -BodySize 1200 -BodyColor "333333" -BodyLines @(
  "• 로컬 실행 환경과 초기 데이터 상태가 팀원마다 달랐습니다.",
  "• 오류가 발생해도 자동 재시작 정책 때문에 실제 실패 원인을 빠르게 확인하기 어려웠습니다."
)

$solutionShape = New-TextShape -Id 5 -Name "Solution" -X 6355080 -Y 1143000 -Cx 5486400 -Cy 2103120 -TitleSize 1800 -TitleColor "FF7A1A" -Heading "해결" -BodySize 1200 -BodyColor "333333" -BodyLines @(
  "• Playwright 기반 E2E 테스트로 회원가입, 로그인, 동네 인증, 채팅, 예약, 리뷰 흐름을 자동화했습니다.",
  "• 특정 PC가 아니라 다른 팀원의 로컬 환경에서도 같은 시나리오가 실행되는지 반복 검증했습니다."
)

$resultShape = New-TextShape -Id 6 -Name "Result" -X 6355080 -Y 3657600 -Cx 5486400 -Cy 1645920 -TitleSize 1800 -TitleColor "FF7A1A" -Heading "결과" -BodySize 1200 -BodyColor "333333" -BodyLines @(
  "• 환경 차이에서 생기는 문제를 조기에 발견하고, 팀 공통 실행 기준을 마련했습니다.",
  "• E2E 테스트를 기능 검증 도구이자 실행 환경 검증 기준점으로 활용할 수 있었습니다."
)

$footerShape = @"
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="7" name="Footer"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="548640" y="5943600"/>
          <a:ext cx="11277600" cy="457200"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="ko-KR" sz="1100" dirty="0" smtClean="0">
              <a:solidFill><a:srgbClr val="7A7A7A"/></a:solidFill>
              <a:latin typeface="Malgun Gothic"/>
              <a:ea typeface="Malgun Gothic"/>
            </a:rPr>
            <a:t>핵심 흐름을 E2E로 표준화해 팀원 로컬 환경에서도 동일한 재현 기준을 확보했습니다.</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>
"@

$slideXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
$titleShape
$problemShape
$causeShape
$solutionShape
$resultShape
$footerShape
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>
"@

$themeXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Simple Theme">
  <a:themeElements>
    <a:clrScheme name="Simple">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F1F1F"/></a:dk2>
      <a:lt2><a:srgbClr val="F5F5F5"/></a:lt2>
      <a:accent1><a:srgbClr val="FF7A1A"/></a:accent1>
      <a:accent2><a:srgbClr val="FFB36B"/></a:accent2>
      <a:accent3><a:srgbClr val="4A90E2"/></a:accent3>
      <a:accent4><a:srgbClr val="6FCF97"/></a:accent4>
      <a:accent5><a:srgbClr val="A78BFA"/></a:accent5>
      <a:accent6><a:srgbClr val="F2994A"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Simple">
      <a:majorFont>
        <a:latin typeface="Malgun Gothic"/>
        <a:ea typeface="Malgun Gothic"/>
        <a:cs typeface="Arial"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Malgun Gothic"/>
        <a:ea typeface="Malgun Gothic"/>
        <a:cs typeface="Arial"/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Simple">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
        <a:solidFill><a:srgbClr val="F9F4EE"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
        <a:solidFill><a:srgbClr val="FFF7F0"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>
"@

$slideMasterXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld name="Master">
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"
            accent1="accent1" accent2="accent2" accent3="accent3"
            accent4="accent4" accent5="accent5" accent6="accent6"
            hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="1" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle><a:lvl1pPr algn="l"/></p:titleStyle>
    <p:bodyStyle><a:lvl1pPr algn="l"/></p:bodyStyle>
    <p:otherStyle><a:defPPr/></p:otherStyle>
  </p:txStyles>
</p:sldMaster>
"@

$slideLayoutXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"@

$presentationXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"@

$presentationRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>
</Relationships>
"@

$slideRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"@

$slideMasterRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"@

$slideLayoutRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"@

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>
"@

$rootRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$appXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>1</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>E2E Troubleshooting</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>OpenAI Codex</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"@

$created = [DateTime]::UtcNow.ToString("s") + "Z"
$coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>E2E Troubleshooting Slide</dc:title>
  <dc:creator>OpenAI Codex</dc:creator>
  <cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$created</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$created</dcterms:modified>
</cp:coreProperties>
"@

$presPropsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>
"@

$viewPropsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
          xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:normalViewPr/>
  <p:slideViewPr/>
  <p:outlineViewPr/>
  <p:notesTextViewPr/>
  <p:sorterViewPr/>
</p:viewPr>
"@

$tableStylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="TableStyleMedium2"/>
"@

Write-Utf8File (Join-Path $tmpDir "[Content_Types].xml") $contentTypesXml
Write-Utf8File (Join-Path $tmpDir "_rels\.rels") $rootRelsXml
Write-Utf8File (Join-Path $tmpDir "docProps\app.xml") $appXml
Write-Utf8File (Join-Path $tmpDir "docProps\core.xml") $coreXml
Write-Utf8File (Join-Path $tmpDir "ppt\presentation.xml") $presentationXml
Write-Utf8File (Join-Path $tmpDir "ppt\_rels\presentation.xml.rels") $presentationRelsXml
Write-Utf8File (Join-Path $tmpDir "ppt\presProps.xml") $presPropsXml
Write-Utf8File (Join-Path $tmpDir "ppt\viewProps.xml") $viewPropsXml
Write-Utf8File (Join-Path $tmpDir "ppt\tableStyles.xml") $tableStylesXml
Write-Utf8File (Join-Path $tmpDir "ppt\slideMasters\slideMaster1.xml") $slideMasterXml
Write-Utf8File (Join-Path $tmpDir "ppt\slideMasters\_rels\slideMaster1.xml.rels") $slideMasterRelsXml
Write-Utf8File (Join-Path $tmpDir "ppt\slideLayouts\slideLayout1.xml") $slideLayoutXml
Write-Utf8File (Join-Path $tmpDir "ppt\slideLayouts\_rels\slideLayout1.xml.rels") $slideLayoutRelsXml
Write-Utf8File (Join-Path $tmpDir "ppt\theme\theme1.xml") $themeXml
Write-Utf8File (Join-Path $tmpDir "ppt\slides\slide1.xml") $slideXml
Write-Utf8File (Join-Path $tmpDir "ppt\slides\_rels\slide1.xml.rels") $slideRelsXml

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmpDir, $zipPath)
Move-Item -Force $zipPath $pptxPath
Remove-Item -Recurse -Force $tmpDir

Write-Output "Created: $pptxPath"
