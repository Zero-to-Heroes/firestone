<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:ms="urn:microsoft-performance" exclude-result-prefixes="msxsl" version="1.0">
<xsl:output method="html" indent="no" standalone="yes" encoding="UTF-16"/>

<!--***************************************************************************

    Copyright (c) Microsoft Corporation. All rights reserved.

****************************************************************************-->

<!-- ********** LOCALIZATION ********** -->

<xsl:template name="localization">
  <_locDefinition>
    <_locDefault _loc="locNone"/>
    <_locTag _loc="locData">String</_locTag>
  </_locDefinition>
</xsl:template>

<!-- ********** XSL PARAMETERS ********** -->

<xsl:param name="defaultTop"/>
<xsl:param name="defaultLevel"/>

<!-- ********** XSL FUNCTIONS ********** -->

<msxsl:script language="JScript" implements-prefix="ms">

var g_tag = 0;

function unique(list, index)
{
  var check = index - 1;

  if (!list || check == 0 || index == 0) {
    return 1;
  }

  for (var i=0;i &lt; check;i++) {
    var compare = list.item(i).text;
    if (list.item(check).text == compare) {
      return 0;
    }
  }

  return 1;
}

function idof(name)
{
  var id = 1;

  for (var i=name.length; i&gt;0; i--) {
    if (!isNaN(name.charCodeAt(i))) {
      id = name.charCodeAt(i) + id * 37;
    }
  }

  id = Math.abs(314159269 * id) % 1000000007;

  return id;
}

function top(list, field)
{
  try{
    var topIndex = 0;
    var topValue = 0;
    var filter = "Data[@name = '" + field + "']";

    for (var i=0;i &lt; list.length;i++) {
      var node = list.item(i).selectSingleNode(filter);
      if (node) {
        var test = node.text * 1;
        if (test &gt; topValue) {
          topIndex = i;
          topValue = test;
        }
      }
    }

    return (topIndex+1) * 1;

  }catch(e){
    return 0;
  }
}

function tag()
{
    return ++g_tag;
}

</msxsl:script>

<!-- ********** LOCAL VARIABLES ********** -->

<xsl:variable name="Portable" select="/Report/@portable"/>

<xsl:variable name="titles">
  <String ID="report">Report</String>
  <String ID="title">Title</String>
  <String ID="summary">Summary</String>
  <String ID="top">Top:</String>
  <String ID="topOf">of</String>
  <String ID="warnings">Warnings</String>
  <String ID="type">Type</String>
  <String ID="item">Item</String>
  <String ID="warning">Warning</String>
  <String ID="total">Total</String>
  <String ID="average">Average</String>
  <xsl:for-each select="/Report/StringTable/String">
    <xsl:copy-of select="."/>
  </xsl:for-each>
</xsl:variable>

<xsl:variable name="images">
  <xsl:for-each select="/Report/ImageTable/Image">
    <xsl:copy-of select="."/>
  </xsl:for-each>
  <xsl:choose>
    <xsl:when test="$Portable">
      <Image ID="expand"><div style="font-family:webdings;font-size:14pt;line-height:9px;font-weight:100;"><xsl:value-of select="'6'"/></div></Image>
      <Image ID="collapse"><div style="font-family:webdings;font-size:14pt;line-height:9pt;font-weight:100;"><xsl:value-of select="'5'"/></div></Image>
      <Image ID="contents"><div style="font-family:webdings;font-size:13pt;line-height:10pt;font-weight:100;"><xsl:value-of select="'1'"/></div></Image>
      <Image ID="info"><div style="font-family:webdings;font-size:12pt;line-height:9pt;color:deepskyblue;font-weight:100;"><xsl:value-of select="'('"/></div></Image>
      <Image ID="warning"><div style="font-family:webdings;font-size:12pt;line-height:9pt;font-weight:bolder;color:orange;"><xsl:value-of select="'ê'"/></div></Image>
      <Image ID="error"><div style="font-family:webdings;font-size:12pt;line-height:9pt;color:red;font-weight:100;"><xsl:value-of select="'r'"/></div></Image>
      <Image ID="flag"><div style="font-family:wingdings;font-size:10pt;line-height:9pt;color:firebrick;font-weight:100;"><xsl:value-of select="'O'"/></div></Image>
      <Image ID="note"><div style="font-family:webdings;font-size:8pt;line-height:9pt;font-weight:100;"><xsl:value-of select="''"/></div></Image>
      <Image ID="open"> <div style="font-family:arial;font-size:12pt;border:solid 1px black;line-height:9px;">+</div></Image>
      <Image ID="close"><div style="font-family:arial;font-size:10pt;border:solid 1px black;line-height:7px;width:11px;text-align:center;padding-bottom:2px;"><xsl:value-of select="'–'"/></div></Image>
      <Image ID="red"><div style="font-family:webdings;font-size:8pt;line-height:9pt;color:red;font-weight:100;"><xsl:value-of select="'n'"/></div></Image>
      <Image ID="yellow"><div style="font-family:webdings;font-size:8pt;line-height:9pt;color:gold;font-weight:100;"><xsl:value-of select="'n'"/></div></Image>
      <Image ID="green"><div style="font-family:webdings;font-size:8pt;line-height:9pt;color:limegreen;font-weight:100;"><xsl:value-of select="'n'"/></div></Image>
    </xsl:when>
    <xsl:otherwise>
      <Image ID="expand">res://wdc.dll/expand.gif</Image>
      <Image ID="collapse">res://wdc.dll/collapse.gif</Image>
      <Image ID="contents">res://wdc.dll/contents.gif</Image>
      <Image ID="info">res://wdc.dll/info.gif</Image>
      <Image ID="warning">res://wdc.dll/warning.gif</Image>
      <Image ID="error">res://wdc.dll/error.gif</Image>
      <Image ID="flag">res://wdc.dll/flag.gif</Image>
      <Image ID="note">res://wdc.dll/note.gif</Image>
      <Image ID="open">res://wdc.dll/open.gif</Image>
      <Image ID="close">res://wdc.dll/close.gif</Image>
      <Image ID="red">res://wdc.dll/red.gif</Image>
      <Image ID="yellow">res://wdc.dll/yellow.gif</Image>
      <Image ID="green">res://wdc.dll/green.gif</Image>
    </xsl:otherwise>
  </xsl:choose>
</xsl:variable>

<xsl:variable name="tab"><xsl:value-of select="'                '"/></xsl:variable>

<xsl:variable name="Top">
  <xsl:choose>
    <xsl:when test="$defaultTop"><xsl:value-of select="$defaultTop"/></xsl:when>
    <xsl:when test="/Report/@top"><xsl:value-of select="/Report/@top"/></xsl:when>
    <xsl:otherwise>10</xsl:otherwise>
  </xsl:choose>
</xsl:variable>

<xsl:variable name="Level">
  <xsl:choose>
    <xsl:when test="$defaultLevel"><xsl:value-of select="$defaultLevel"/></xsl:when>
    <xsl:when test="/Report/@level"><xsl:value-of select="/Report/@level"/></xsl:when>
    <xsl:otherwise>1</xsl:otherwise>
  </xsl:choose>
</xsl:variable>

<xsl:template match="/">
<html>

<!-- ********** HTML STYLE DEFINITION ********** -->

<style>
  body{ font-family: 'Segoe UI', Arial; color: black; margin-left: 5px; margin-right: 5px; margin-top: 5px;}
  td{ font-size: 75%; }
  th{ font-size: 70%; font-weight: bolder; border: 1px solid lightgrey; vertical-align: bottom; }
  hr{ border:1px solid lightgrey; height:1px; }
  ul{ margin-left: 16px; }
  li { font-size: 90%; }
  li li { font-size: 75%; }
  li li li { font-size: 90%; }

  .block{ border: solid gray 1px; width: 100%; }
  .popup{ position:absolute; z-index:1; background-color:infobackground; border:solid; border-width:1px; border-right-width:2px; border-bottom-width:2px; font-size: x-small;font-weight: normal;text-align: left;padding: 8px; }
  .layout{ border: 0; padding: 0; width: 100%; }
  .content{ border: solid gray 1px; width: 100%; border-top:'none';}
  .local { color: windowtext; }

  .top {
    padding-top: 1px;
    margin: 1px;
    border: none;
    font-size: 100%;
    font-family: Verdana, Arial;
  }

  .title-bar{
    color: buttontext;
    margin-top: 5px;
    border: solid gray 1px;
    width: 100%;
    padding: 3;
    font-weight: bolder;
    vertical-align: middle;
    filter:progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='buttonhighlight',EndColorStr='threedshadow');
  }

  .topic-bar {
    color: buttontext;
    margin-top: 5px;
    border: solid gray 1px;
    width: 100%;
    padding: 4;
    font-weight: bolder;
    font-size: 20%
    vertical-align: middle;
    filter:progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='threedhighlight',EndColorStr='threedlightshadow');
  }

  .toc-window {
    background: window;
    position: absolute;
    z-index: 1;
    border:solid gray;
    border-width:1px;
    border-right-width: 2px;
    border-bottom-width: 2px;
  }

  .toc-top {
    color: gray;
    background: lightgrey;
    border-bottom:solid gray 1px;
    text-align:right;
    text-decoration:none;
    padding-right:2px;
  }

  .toc-content {
    padding-top: 8px;
    background: window;
    font-weight: normal;
    text-align: left;
    padding-left: 8px;
    height: 400px;
    width: 230px;
    overflow-y: scroll;
  }

  .h1{ font-size: 90%; font-weight: bolder; }
  .h2{ font-size: 90%; font-weight: bolder; }
  .h3{ font-size: 80%; font-weight: bolder; font-style: italic; }
  .h4{ font-size: 70%; font-weight: bolder;}

  .b1{ background: white; }
  .b2{ background: whitesmoke; }

  .w1{ background: pink; }

  .bold{ font-weight: bolder; }
  .italic{ font-style: italic; }

  .number{ text-align: right; }
  .string{ text-align: left; }
  .info{ font-size: 70%; }
  .code{ font-family: courier; }
  .span{ text-align: center; border-bottom:1px solid lightgrey;}

  .total{ font-style: normal; }
  .average{ font-style: italic; }
</style>

<body class="b1">
<form>

<!-- ********** RUNTIME SCRIPT ********** -->

<script>

var cc = "";

function popup(d)
{
  var x = window.event.x + 12;
  var y = window.event.clientY + document.body.scrollTop - 5;

  d.style.display = '';

  if ((y + d.clientHeight) - document.body.scrollTop &gt; document.body.clientHeight) {
    y = y - d.clientHeight;
    if (y &lt; document.body.scrollTop) {
      y = document.body.scrollTop + 2;
    }
  }

  d.style.top = y;

  if (d.clientWidth + x &gt; (document.body.clientWidth-4)) {
    d.style.left =  window.event.x - 8 - d.clientWidth;
    d.style.right = window.event.x - 8;
  }else{
    d.style.left =  x;
    d.style.right = x + d.clientWidth;
  }
}

function compare(elem1, elem2, reverse)
{
  var sgn = reverse ? -1 : 1;

  if (elem1.isnum <xsl:value-of select="'&amp;&amp;'"/> !elem2.isnum) {
    return -1;
  }
  if (elem2.isnum <xsl:value-of select="'&amp;&amp;'"/> !elem1.isnum) {
    return 1;
  }
  if (elem1.text &lt; elem2.text) {
    return -sgn;
  }
  if (elem1.text &gt; elem2.text) {
    return sgn;
  }
  return 0;
}

function sort(t)
{
  try{
    var tbody = t.tBodies(0);
    var iColumn = window.event.srcElement.cellIndex;
    var reverse;
    var iRowEnd = tbody.rows.length-1;
    var iSortRowCnt;

    for (var col = 0; col &lt; iColumn; col++) {
      if (tbody.rows[0].cells[col].colSpan &gt; 1) {
        iColumn -= (tbody.rows[0].cells[col].colSpan - 1);
      }
    }

    var key = t.id + "_" + iColumn;

    if (isNaN( tbody.children[0].children[iColumn].innerText.charAt(0))) {
      reverse = false;
    }else{
      reverse = true;
    }

    if (cc == key) {
      cc = "";
      reverse = !reverse;
    }else{
      cc = key;
    }

    var t1 = new Array();
    var t2 = new Array();
    var tab1, tab2;
    var i, j;
    var re =/\D/g;

    iSortRowCnt = 0;
    for (i = 0; i &lt;= iRowEnd; ++i) {
      if (tbody.children[i].child == 'true') {
        continue;
      }

      t1[iSortRowCnt] = new Object();
      if (typeof(tbody.children[i].children[iColumn]) != "undefined") {
        text = tbody.children[i].children[iColumn].innerText;
      }else{
        text = "";
      }

      if (!isNaN(text.charAt(0))) {
        t1[iSortRowCnt].text = eval(text.replace(re, ""));
        t1[iSortRowCnt].isnum = true;
      }else{
        t1[iSortRowCnt].text = text.toLowerCase();
        t1[iSortRowCnt].isnum = false;
      }

      t1[iSortRowCnt].ptr = tbody.children[i];
      iSortRowCnt++;
    }

    tab2 = t1;
    tab1 = t2;
    for (var iSize = 1; iSize &lt; iSortRowCnt; iSize *= 2) {
      var iBeg, iLeft, iRight, iLeftEnd, iRightEnd, iDest;

      if (tab1 == t2) {
        tab1 = t1;
        tab2 = t2;
      }else{
        tab1 = t2;
        tab2 = t1;
      }

      for (iBeg = 0; iBeg &lt; iSortRowCnt; iBeg += iSize*2) {
        iRight = iBeg+iSize;

        if (iRight &gt;= iSortRowCnt) {
          break;
        }

        iRightEnd = iRight+iSize-1;

        if (iRightEnd &gt;= iSortRowCnt) {
          iRightEnd = iSortRowCnt-1;
        }

        iLeftEnd = iRight-1;
        iLeft = iBeg;

        for (iDest = iLeft; iDest &lt;= iRightEnd; ++iDest) {
          if ((iRight &gt; iRightEnd) ||
            (iLeft &lt;= iLeftEnd <xsl:value-of select="'&amp;&amp;'"/>
            compare(tab1[iLeft], tab1[iRight], reverse) &lt;= 0)) {
            tab2[iDest] = tab1[iLeft];
            ++iLeft;
          }else{
            tab2[iDest] = tab1[iRight];
            ++iRight;
          }
        }
      }

      for (iDest = iRightEnd+1; iDest &lt; iSortRowCnt; ++iDest) {
        tab2[iDest] = tab1[iDest];
      }
    }

    for (i = iSortRowCnt-1; i &gt;= 0; --i) {
      var first = tbody.children[0];
      var insert = tab2[i].ptr, next;

      if (insert == first) {
        continue;
      }

      next = insert.nextSibling;
      while (next <xsl:value-of select="'&amp;&amp;'"/> next.child == 'true') {
        tbody.insertBefore(insert, first);
        insert = next;
        next = insert.nextSibling;
      }
      tbody.insertBefore(insert, first);
    }

  } catch(e) {
  }

  if (tbody.mode != "child") {
    show(t);
  }

  shade(tbody);
}

function show(t)
{
  try {
    var tbody = t.tBodies(0);
    var top = document.all("top_"+t.id).value;
    var count = 0;
    var visible = 0;

    for (var i=0; i&lt;tbody.rows.length;i++) {

      if (tbody.children[i].child != 'true') {
        children = 0;
        if (count++ &lt; top){
          tbody.children[i].style.display = '';
          visible++;
        }else{
          tbody.children[i].style.display = 'none';
        }

      }else{
        if (tbody.children[i].style.display == '') {
          folder(tbody.children[i]);
        }
      }
    }

    document.all("top_"+t.id).value = visible;

    shade(tbody);
  }catch(e){
  }
}

function shade(tbody)
{
  var p = 0;

  for (var i = 0; i &lt; tbody.rows.length; i++) {
    if (tbody.children[i].style.display == '') {
      if (tbody.children[i].child != 'true') {
        p++;
      }
      if (p % 2 == 0) {
        className = "b1";
      }else{
        className = "b2";
      }
      if (tbody.children[i].child != 'true' <xsl:value-of select="'&amp;&amp;'"/> tbody.children[i].autoshade != 'true') {
        try{
          tbody.children[i].className = className;
        }catch(e){
        }
      }
    }
  }
}

function pressTop(t)
{
  if (window.event.keyCode == 13) {
    show(t);
    window.event.returnValue = false;
  }
}

function folder(d)
{
  try{
    var temp;
    var i = document.all("e_" + d.id);

    if (d.style.display == 'none') {
      d.style.display = '';
    }else{
      d.style.display = 'none';
    }
    if (i.nodeName == "IMG") {
      temp = i.src;
      i.src = i.altImage;
      i.altImage = temp;
    }else{
      var s = document.all("alt_" + i.id);
      temp = i.innerHTML;
      i.innerHTML = s.innerHTML;
      s.innerHTML = temp;
    }
  } catch(e) {
  }
}

function hideTOC()
{
  TOC.style.display = 'none';
}

function showTOC()
{
  try{
    window.event.cancelBubble = true;
    popup(TOC);
  }catch(e){
  }
}

function reveal(d)
{
  try{
    var t;
    for (var i=0; i&lt;document.anchors.length; i++) {
      if (document.anchors[i].name == d) {
        t = document.anchors[i];
        break;
      }
    }

    if (t) {
      var parent = t.parentElement;

      while (parent) {
        if (parent.expandable == '1' <xsl:value-of select="'&amp;&amp;'"/> parent.style.display == 'none') {
          folder(parent);
        }

        parent = parent.parentElement;
      }
    }
  }catch(e){
  }
}

</script>

<!-- ********** REPORT HEADER ********** -->

<xsl:for-each select="/Report[@name]">
<xsl:variable name="reportId" select="ms:tag()"/>
<xsl:if test="count(//Data[@header]) = 0">
  <a name="title"/>
</xsl:if>
<div class="title-bar">
<xsl:if test="count(//Data[@header])">
  <xsl:attribute name="onclick">folder(c_<xsl:value-of select="$reportId"/>)</xsl:attribute>
</xsl:if>
  <table class="layout">
    <tr>
      <td class="h1" width="400">
        <xsl:call-template name="title"/>
      </td>
      <td>
        <a style="cursor:hand;text-decoration:none;" onclick="showTOC()">
          <xsl:call-template name="image">
            <xsl:with-param name="src" select="'contents'"/>
          </xsl:call-template>
        </a>
      </td>
      <td>
        <xsl:if test="count(//Data[@header])">
          <a style="cursor:hand;text-decoration:none;">
            <div style="float:right">
              <xsl:call-template name="image">
                <xsl:with-param name="src" select="'collapse'"/>
                <xsl:with-param name="alt" select="'expand'"/>
                <xsl:with-param name="id">e_c_<xsl:value-of select="$reportId"/></xsl:with-param>
              </xsl:call-template>
            </div>
          </a>
        </xsl:if>
      </td>
    </tr>
  </table>
</div>
<xsl:if test="count(//Data[@header])">
  <div expandable="1">
  <xsl:attribute name="id">c_<xsl:value-of select="$reportId"/></xsl:attribute>
    <a name="title"/>
    <table class="content" cellpadding="2">
      <tr>
        <td>
          <table>
            <xsl:for-each select="//Data[@header]">
              <tr>
                <td class="h4">
                  <xsl:call-template name="label">
                    <xsl:with-param name="label" select="@header"/>
                  </xsl:call-template>
                  <xsl:text>:</xsl:text>
                </td>
                <td class="info">
                  <xsl:call-template name="data"/>
                  <xsl:apply-templates select="@warning|@note"/>
                </td>
              </tr>
            </xsl:for-each>
          </table>
        </td>
      </tr>
    </table>
  </div>
</xsl:if>
</xsl:for-each>

<!-- ********** SUMMARY SECTION ********** -->

<xsl:if test="//Table[Summary/@topic]">
<xsl:variable name="summaryId">s_<xsl:value-of select="ms:tag()"/></xsl:variable>
<div class="title-bar">
<xsl:attribute name="onclick">folder(c_<xsl:value-of select="$summaryId"/>)</xsl:attribute>
  <table class="layout">
    <tr>
      <td class="h1" width="400">
        <xsl:call-template name="label">
          <xsl:with-param name="label" select="'summary'"/>
        </xsl:call-template>
      </td>
      <td>
        <a style="cursor:hand;text-decoration:none;" onclick="showTOC()">
          <xsl:call-template name="image">
            <xsl:with-param name="src" select="'contents'"/>
          </xsl:call-template>
        </a>
      </td>
      <td>
        <a style="cursor:hand;text-decoration:none;">
          <div style="float:right">
            <xsl:call-template name="image">
              <xsl:with-param name="src" select="'collapse'"/>
              <xsl:with-param name="alt" select="'expand'"/>
              <xsl:with-param name="id">e_c_<xsl:value-of select="$summaryId"/></xsl:with-param>
            </xsl:call-template>
          </div>
        </a>
      </td>
    </tr>
  </table>
</div>
<div expandable="1">
<xsl:attribute name="id">c_<xsl:value-of select="$summaryId"/></xsl:attribute>
  <a name="summary"/>
  <xsl:variable name="topics">
    <xsl:for-each select="//Summary[@topic]">
    <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
    <xsl:sort select="@key" data-type="number"/>
      <xsl:element name="topic">
        <xsl:value-of select="@topic"/>
      </xsl:element>
    </xsl:for-each>
  </xsl:variable>
  <table cellspacing="1" cellpadding="1" class="content">
    <tr>
      <xsl:for-each select="//Summary[@topic]/@topic">
      <xsl:sort select="not(parent::node()/@key) or parent::node()/@key &lt; 0" data-type="number"/>
      <xsl:sort select="parent::node()/@key" data-type="number"/>
        <xsl:if test="ms:unique(msxsl:node-set($topics)/topic, number(position()))">
          <td valign="top">
            <table class="layout">
              <tr>
                <th colspan="2" class="string">
                  <xsl:call-template name="label">
                    <xsl:with-param name="label" select="."/>
                  </xsl:call-template>
                </th>
              </tr>
              <xsl:for-each select="//Summary[@topic=current()]">
              <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
              <xsl:sort select="@key" data-type="number"/>
                <xsl:variable name="summaryTable"><xsl:value-of select="parent::Table/@name"/></xsl:variable>
                <xsl:variable name="exclude" select="@exclude"/>
                <xsl:variable name="value" select="@value"/>
                <xsl:variable name="field" select="@field"/>
                <xsl:for-each select="Data">
                  <xsl:variable name="format" select="@format"/>
                  <tr>
                    <td width="12%" style="white-space:nowrap;" class="info bold" valign="bottom">
                      <xsl:choose>
                        <xsl:when test="position() = 1">
                        <a class="local">
                        <xsl:attribute name="onclick">reveal('<xsl:value-of select="ms:idof(string($summaryTable))"/>')</xsl:attribute>
                        <xsl:attribute name="href">#<xsl:value-of select="ms:idof(string($summaryTable))"/></xsl:attribute>
                          <xsl:call-template name="title">
                            <xsl:with-param name="noUnit" select="1"/>
                          </xsl:call-template>
                        </a>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:call-template name="title">
                            <xsl:with-param name="noUnit" select="1"/>
                          </xsl:call-template>
                        </xsl:otherwise>
                      </xsl:choose>
                      <xsl:text>:</xsl:text>
                    </td>
                    <td style="padding-left: 5px;" class="info" valign="bottom">
                      <xsl:choose>
                        <xsl:when test="parent::Summary/@find='total'">
                          <xsl:value-of select="format-number(sum(/Report/Section/Table[@name=$summaryTable]/Item[Data[@name=$exclude] != $value]/Data[@name=$field]), $format)"/>
                        </xsl:when>
                        <xsl:when test="parent::Summary/@find='average'">
                          <xsl:value-of select="format-number(sum(/Report/Section/Table[@name=$summaryTable]/Item[Data[@name=$exclude] = $value or not($exclude)]/Data[@name=$field]) div count(/Report/Section/Table[@name=$summaryTable][1]/Item/Data[@name=$field]), $format)"/>
                        </xsl:when>
                        <xsl:when test="parent::Summary/@find='top'">
                          <xsl:variable name="list" select="/Report/Section/Table[@name=$summaryTable]/Item[Data[@name=$exclude] != $value or not($exclude)]"/>
                          <xsl:variable name="summaryIndex"><xsl:value-of select="ms:top(msxsl:node-set($list), string($field))"/></xsl:variable>
                          <xsl:for-each select="msxsl:node-set($list)[number($summaryIndex)]/Data[@name=current()/@name]">
                            <xsl:if test="position() = 1">
                              <xsl:call-template name="data">
                                <xsl:with-param name="format" select="$format"/>
                                <xsl:with-param name="noLink" select="1"/>
                              </xsl:call-template>
                              <xsl:apply-templates select="@warning|@note"/>
                            </xsl:if>
                          </xsl:for-each>
                        </xsl:when>
                        <xsl:when test="parent::Summary/@find='field'">
                          <xsl:for-each select="/Report/Section/Table[@name=$summaryTable]/Item[Data[@name=$field]=$value or not($value)]/Data[@name=current()/@name]">
                            <xsl:call-template name="data">
                              <xsl:with-param name="format" select="$format"/>
                              <xsl:with-param name="noLink" select="1"/>
                            </xsl:call-template>
                            <xsl:apply-templates select="@warning|@note"/>
                          </xsl:for-each>
                        </xsl:when>
                      </xsl:choose>
                      <xsl:if test="@units">
                        <xsl:value-of select="' '"/>
                        <xsl:call-template name="label">
                          <xsl:with-param name="label" select="@units"/>
                        </xsl:call-template>
                      </xsl:if>
                    </td>
                  </tr>
                </xsl:for-each>
                <xsl:if test="position() != last()">
                  <tr><td colspan="2" height="5"/></tr>
                </xsl:if>
              </xsl:for-each>
            </table>
          </td>
        </xsl:if>
      </xsl:for-each>
    </tr>
  </table>
</div>

</xsl:if>

<!-- ********** SECTION HEADER ********** -->

<xsl:for-each select="Report/Section[(Table[Item[@level &lt;= $Level or not(@level)][not(@visible='false')]][@level &lt;= $Level or not(@level)][ not( @visible='false')]) or (@name='advice' and //@warning) and (@level &gt; $Level or not(@level))]">
<xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
<xsl:sort select="@key" data-type="number"/>

<xsl:variable name="sectionId" select="ms:tag()"/>
<div class="title-bar">
<xsl:attribute name="onclick">folder(c_<xsl:value-of select="$sectionId"/>)</xsl:attribute>
  <table class="layout">
    <tr>
      <td class="h1" width="400">
        <xsl:call-template name="title"/>
        <xsl:apply-templates select="@warning|@note"/>
      </td>
      <td>
        <a style="cursor:hand;text-decoration:none;" onclick="showTOC()">
          <xsl:call-template name="image">
            <xsl:with-param name="src" select="'contents'"/>
          </xsl:call-template>
        </a>
      </td>
      <td>
        <a style="cursor:hand;text-decoration:none;">
          <div style="float:right">
            <xsl:choose>
              <xsl:when test="not(@name='advice' or @expand)">
                <xsl:call-template name="image">
                  <xsl:with-param name="src" select="'expand'"/>
                  <xsl:with-param name="alt" select="'collapse'"/>
                  <xsl:with-param name="id">e_c_<xsl:value-of select="$sectionId"/></xsl:with-param>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <xsl:call-template name="image">
                  <xsl:with-param name="src" select="'collapse'"/>
                  <xsl:with-param name="alt" select="'expand'"/>
                  <xsl:with-param name="id">e_c_<xsl:value-of select="$sectionId"/></xsl:with-param>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </div>
        </a>
      </td>
    </tr>
  </table>
</div>
<div expandable="1">
<xsl:attribute name="id">c_<xsl:value-of select="$sectionId"/></xsl:attribute>
<xsl:if test="not(@name='advice' or @expand)">
  <xsl:attribute name="style">display:'none';</xsl:attribute>
</xsl:if>

<!-- ********** TOPIC HEADER ********** -->

<xsl:variable name="tables" select="Table[Item[@level &lt;= $Level or not(@level)][not(@visible='false')]][not(@visible = 'false') and (@level &lt;= $Level or not(@level))]"/>

<xsl:variable name="topics">
  <xsl:for-each select="$tables[@topic]">
  <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
  <xsl:sort select="@key" data-type="number"/>
    <xsl:element name="topic">
      <xsl:value-of select="@topic"/>
    </xsl:element>
  </xsl:for-each>
</xsl:variable>

<xsl:for-each select="msxsl:node-set($topics)/topic">
  <xsl:if test="ms:unique(msxsl:node-set($topics)/topic, number(position()))">
    <xsl:variable name="topic" select="."/>
    <xsl:variable name="topicId"><xsl:value-of select="ms:idof(string($topic))"/><xsl:value-of select="ms:idof(string($sectionId))"/></xsl:variable>
    <div class="topic-bar">
    <xsl:attribute name="onclick">folder(c_<xsl:value-of select="$topicId"/>)</xsl:attribute>
      <table class="layout" cellpadding="0" cellspacing="0">
        <tr>
          <td class="h3">
            <xsl:call-template name="label">
              <xsl:with-param name="label" select="$topic"/>
            </xsl:call-template>
          </td>
          <td>
            <a style="cursor:hand;text-decoration:none;">
              <div style="float:right;margin-right:2px;">
                <xsl:choose>
                  <xsl:when test="$tables[@topic=$topic]/@expand">
                    <xsl:call-template name="image">
                      <xsl:with-param name="src" select="'collapse'"/>
                      <xsl:with-param name="alt" select="'expand'"/>
                      <xsl:with-param name="id">e_c_<xsl:value-of select="$topicId"/></xsl:with-param>
                    </xsl:call-template>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:call-template name="image">
                      <xsl:with-param name="src" select="'expand'"/>
                      <xsl:with-param name="alt" select="'collapse'"/>
                      <xsl:with-param name="id">e_c_<xsl:value-of select="$topicId"/></xsl:with-param>
                    </xsl:call-template>
                  </xsl:otherwise>
                </xsl:choose>
              </div>
            </a>
          </td>
        </tr>
      </table>
    </div>
    <div expandable="1">
    <xsl:if test="not($tables[@topic=$topic]/@expand)">
      <xsl:attribute name="style">display:'none';</xsl:attribute>
    </xsl:if>

    <xsl:attribute name="id">c_<xsl:value-of select="$topicId"/></xsl:attribute>
      <xsl:for-each select="$tables[@topic=$topic]">
      <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
      <xsl:sort select="@key" data-type="number"/>
        <xsl:apply-templates select="."/>
      </xsl:for-each>
    </div>
  </xsl:if>
</xsl:for-each>

<xsl:for-each select="$tables[not(@topic)]">
<xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
<xsl:sort select="@key" data-type="number"/>
  <xsl:apply-templates select="."/>
</xsl:for-each>

</div>

</xsl:for-each>

<!-- ********** TABLE OF CONTENTS ********** -->

<div id="TOC" style="display:'none';" class="toc-window">
  <div class="toc-top" onclick="hideTOC()">
    <font face="wingdings" size="+1" style="cursor:hand; font-weight: lighter;"><xsl:value-of select="'x'"/></font>
  </div>
  <div class="toc-content">
  <ul>
    <xsl:if xmlns:xsl="http://www.w3.org/1999/XSL/Transform" test="//Table[Summary] or /Report[@name]">
      <li>
        <xsl:choose>
          <xsl:when test="/Report/@name">
            <xsl:call-template name="label">
              <xsl:with-param name="label" select="/Report/@name"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="label">
              <xsl:with-param name="label" select="'report'"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
        <ul>
        <xsl:if test="/Report[@name]">
          <li>
            <a class="local" href="#title" onclick="hideTOC();reveal('title')">
              <xsl:call-template name="label">
                <xsl:with-param name="label" select="'title'"/>
              </xsl:call-template>
            </a>
          </li>
        </xsl:if>
        <xsl:if test="//Table[Summary]">
          <li>
            <a class="local" href="#summary" onclick="hideTOC();reveal('summary')">
              <xsl:call-template name="label">
                <xsl:with-param name="label" select="'summary'"/>
              </xsl:call-template>
            </a>
          </li>
        </xsl:if>
        </ul><br/>
      </li>
    </xsl:if>

    <xsl:for-each xmlns:xsl="http://www.w3.org/1999/XSL/Transform" select="Report/Section[(Table[@level &lt;= $Level or not(@level)][Item[@level &lt;= $Level or not(@level)][not(@visible='false')]][ not( @visible='false')]) or (@name='advice' and //@warning)]">
    <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
    <xsl:sort select="@key" data-type="number"/>
      <li>
        <xsl:call-template name="title"/>
      </li>
      <ul>
        <xsl:variable name="tables" select="Table[@level &lt;= $Level or not(@level)][Item[@level &lt;= $Level or not(@level)][not(@visible='false')]][not(@visible='false')]"/>

        <xsl:variable name="topics">
          <xsl:for-each select="$tables[@topic]">
          <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
          <xsl:sort select="@key" data-type="number"/>
            <xsl:element name="topic">
              <xsl:value-of select="@topic"/>
            </xsl:element>
          </xsl:for-each>
        </xsl:variable>

        <xsl:for-each select="msxsl:node-set($topics)/topic">
          <xsl:if test="ms:unique(msxsl:node-set($topics)/topic, number(position()))">
            <xsl:variable name="topic" select="."/>
            <li>
              <xsl:call-template name="label">
                <xsl:with-param name="label" select="$topic"/>
              </xsl:call-template>
            </li>
            <ul>
              <xsl:for-each select="$tables[@topic=$topic]">
              <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
              <xsl:sort select="@key" data-type="number"/>
                <li>
                  <a class="local">
                  <xsl:attribute name="href">#<xsl:value-of select="ms:idof(string(@name))"/></xsl:attribute>
                  <xsl:attribute name="onclick">hideTOC();reveal('<xsl:value-of select="ms:idof(string(@name))"/>')</xsl:attribute>

                    <xsl:call-template name="title"/>

                  </a>
                </li>
              </xsl:for-each>
            </ul>
          </xsl:if>

        </xsl:for-each>

        <xsl:for-each select="$tables[not(@topic)]">
        <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
        <xsl:sort select="@key" data-type="number"/>
          <li>
            <a class="local">
            <xsl:attribute name="href">#<xsl:value-of select="ms:idof(string(@name))"/></xsl:attribute>
            <xsl:attribute name="onclick">hideTOC();reveal('<xsl:value-of select="ms:idof(string(@name))"/>')</xsl:attribute>
              <xsl:call-template name="title"/>
            </a>
          </li>
        </xsl:for-each>
      </ul>
      <br/>
    </xsl:for-each>
  </ul>
  </div>
</div>

</form>
</body>
</html>
</xsl:template>

<!-- ********** TABLE TEMPLATES ********** -->

<xsl:template match="Table">

<xsl:variable name="table"><xsl:value-of select="@name"/></xsl:variable>
<xsl:variable name="tableId">table_<xsl:value-of select="ms:tag()"/></xsl:variable>
<a><xsl:attribute name="name"><xsl:value-of select="ms:idof(string(@name))"/></xsl:attribute></a>
<xsl:for-each select="@anchor|@warning">
  <a>
  <xsl:attribute name="name"><xsl:value-of select="ms:idof(string(.))"/></xsl:attribute>
  </a>
</xsl:for-each>

<!-- ********** TABLE SETUP ********** -->


  <xsl:variable name="count">
    <xsl:call-template name="itemCount"/>
  </xsl:variable>

  <xsl:variable name="totalCount">
    <xsl:choose>
      <xsl:when test="@count">
        <xsl:value-of select="@count"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="count(Item[not(@visible='false')])"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="show">
    <xsl:call-template name="show">
      <xsl:with-param name="header" select="Header"/>
    </xsl:call-template>
  </xsl:variable>

<!-- ********** TABLE TITLE ********** -->

<table class="block" cellspacing="3px" cellpadding="0" style="margin-top: 5px;">
  <tr>
    <td>
      <table width="100%">
        <tr>
          <td class="h2">
            <xsl:call-template name="title"/>
            <xsl:apply-templates select="@warning|@note"/>
          </td>
          <td align="right" valign="top">
            <xsl:if test="not(@style)">
              <font size="-2">
              <xsl:call-template name="label">
                <xsl:with-param name="label" select="'top'"/>
              </xsl:call-template>

              <xsl:value-of select="' '"/>

              <input type="text" size="3" class="top b1" onmouseover="style.border='inset 1px';style.margin='0px'" onmouseout="style.border='none';style.margin='1px'">
              <xsl:attribute name="id">top_<xsl:value-of select="$tableId"/></xsl:attribute>
              <xsl:attribute name="onchange">show(<xsl:value-of select="$tableId"/>)</xsl:attribute>
              <xsl:attribute name="onkeypress">pressTop(<xsl:value-of select="$tableId"/>)</xsl:attribute>
              <xsl:attribute name="value"><xsl:value-of select="$show"/></xsl:attribute>
              </input>

              <xsl:call-template name="label">
                <xsl:with-param name="label" select="'topOf'"/>
              </xsl:call-template>
              <xsl:value-of select="'  '"/>
              <xsl:value-of select="$count"/>
              </font>

              <xsl:value-of select="' '"/>
            </xsl:if>
          </td>
        </tr>
      </table>
    </td>
  </tr>

<!-- ********** TABLE BODY ********** -->

  <tr>
    <td>
      <xsl:choose>
        <xsl:when test="@style='info'">
          <xsl:call-template name="infoTable">
            <xsl:with-param name="Level" select="$Level"/>
            <xsl:with-param name="tableId" select="$tableId"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="colTable">
            <xsl:with-param name="header" select="Header"/>
            <xsl:with-param name="id" select="$tableId"/>
            <xsl:with-param name="show" select="$show"/>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </td>
  </tr>
</table>

</xsl:template>

<!-- ********** TOP SETUP ********** -->

<xsl:template name="show">
<xsl:param name="header"/>
  <xsl:variable name="count">
    <xsl:call-template name="itemCount"/>
  </xsl:variable>
  <xsl:variable name="minField">
    <xsl:choose>
    <xsl:when test="$header/Threshold[@type='min']"><xsl:value-of select="$header/Threshold[@type='min']/@field"/></xsl:when>
    <xsl:otherwise><xsl:value-of select="Item[1]/Data[1]/@name"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="min">
    <xsl:choose>
    <xsl:when test="$header/Threshold[@type='min']"><xsl:value-of select="$header/Threshold[@type='min']/@value"/></xsl:when>
    <xsl:otherwise>all</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="octaveField">
    <xsl:choose>
    <xsl:when test="$header/Threshold[@type='octave']"><xsl:value-of select="$header/Threshold[@type='octave']/@field"/></xsl:when>
    <xsl:otherwise><xsl:value-of select="Item[1]/Data[1]/@name"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="octave">
    <xsl:choose>
    <xsl:when test="$header/Threshold[@type='octave']">
      <xsl:variable name="octaveIndex"><xsl:value-of select="ms:top(Item, string($octaveField))"/></xsl:variable>
      <xsl:value-of select="Item[number($octaveIndex)]/Data[@name=$octaveField] div 2"/>
    </xsl:when>
    <xsl:otherwise>all</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="top">
    <xsl:choose>
    <xsl:when test="$header/Threshold[@type='top']/@type = 'top'"><xsl:value-of select="$header/Threshold[@type='top']/@value"/></xsl:when>
    <xsl:otherwise><xsl:value-of select="$Top"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="octaveCount">
    <xsl:choose>
      <xsl:when test="$octave = 'all'">0</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="count(Item[@level &lt;= $Level or not(@level)][not(@visible='false')][Data[@name = $octaveField] &gt;= $octave])"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="minCount">
    <xsl:choose>
      <xsl:when test="$min = 'all'">0</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="count(Item[@level &lt;= $Level or not(@level)][not(@visible='false')][Data[@name = $minField] &gt;= $min])"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="show">
    <xsl:choose>
      <xsl:when test="$octaveCount &gt; $top and $octaveCount &gt;= $minCount">
        <xsl:value-of select="$octaveCount"/>
      </xsl:when>
      <xsl:when test="$minCount &gt; $top and $minCount &gt; $octaveCount">
        <xsl:value-of select="$minCount"/>
      </xsl:when>
      <xsl:when test="$top = 'all' or ($top != 'all' and $top &gt; $count)">
        <xsl:value-of select="$count"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$top"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:value-of select="$show"/>

</xsl:template>

<!-- ********** SORT SETUP ********** -->

<xsl:template name="itemCount">
  <xsl:value-of select="count(Item[@level &lt;= $Level or not(@level)][not(@visible='false')])"/>
</xsl:template>

<xsl:template name="colTable">
<xsl:param name="mode"/>
<xsl:param name="id"/>
<xsl:param name="header"/>
<xsl:param name="show"/>
<xsl:param name="table"/>


  <xsl:variable name="max">
    <xsl:choose>
      <xsl:when test="string-length($show)">all</xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="show">
          <xsl:with-param name="header" select="$header"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="tableId">
    <xsl:choose>
      <xsl:when test="string-length($id)"><xsl:value-of select="$id"/></xsl:when>
      <xsl:otherwise>table_<xsl:value-of select="ms:tag()"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="order1">
    <xsl:choose>
    <xsl:when test="$header/Sort[1]/@order"><xsl:value-of select="$header/Sort[1]/@order"/></xsl:when>
    <xsl:otherwise>ascending</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="type1">
    <xsl:choose>
    <xsl:when test="$header/Sort[1]/@type"><xsl:value-of select="$header/Sort[1]/@type"/></xsl:when>
    <xsl:otherwise>number</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="order2">
    <xsl:choose>
    <xsl:when test="$header/Sort[2]/@order"><xsl:value-of select="$header/Sort[2]/@order"/></xsl:when>
    <xsl:otherwise>ascending</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="type2">
    <xsl:choose>
    <xsl:when test="$header/Sort[2]/@type"><xsl:value-of select="$header/Sort[2]/@type"/></xsl:when>
    <xsl:otherwise>number</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

<!-- ********** TABLE HEAD ********** -->

  <table class="block" style="table-layout:auto">
  <xsl:attribute name="id"><xsl:value-of select="$tableId"/></xsl:attribute>
  <xsl:attribute name="showId"><xsl:value-of select="@name"/></xsl:attribute>

  <thead style="display: table-header-group">
    <xsl:for-each select="$header">
      <tr>
        <xsl:if test="Header[Data]">
          <td width="1%"/>
        </xsl:if>

        <xsl:apply-templates select="Data[not(@visible='false')][(@level &lt;= $Level or not(@level))]" mode="header">
          <xsl:with-param name="tableId" select="$tableId"/>
          <xsl:with-param name="sort"><xsl:if test="position()=last()">true</xsl:if></xsl:with-param>
        </xsl:apply-templates>

      </tr>
    </xsl:for-each>
  </thead>

<!-- ********** TABLE BODY ********** -->

  <tbody>
  <xsl:if test="string-length($mode)">
    <xsl:attribute name="mode"><xsl:value-of select="$mode"/></xsl:attribute>
  </xsl:if>
    <xsl:for-each select="Item[not(@visible='false')][ ($max = 'all' or position() &lt;= $max)][(@level &lt;= $Level or not(@level))]">

    <xsl:sort select="Data[@name=$header/Sort[1]/@field]" order="{$order1}" data-type="{$type1}"/>
    <xsl:sort select="Data[@name=$header/Sort[2]/@field]" order="{$order2}" data-type="{$type2}"/>

      <xsl:variable name="rowId" select="ms:tag()"/>

      <xsl:variable name="background">
        <xsl:choose>
        <xsl:when test="Data[@warning]">w1</xsl:when>
        <xsl:when test="position() mod 2 = 1">b2</xsl:when>
        <xsl:otherwise>b1</xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <tr>
      <xsl:if test="Data[@warning]">
        <xsl:attribute name="autoshade">true</xsl:attribute>
      </xsl:if>
      <xsl:attribute name="class"><xsl:value-of select="$background"/></xsl:attribute>
      <xsl:attribute name="index"><xsl:value-of select="position()"/></xsl:attribute>
      <xsl:attribute name="style">
        <xsl:choose>
          <xsl:when test="not($show)"></xsl:when>
          <xsl:when test="position() &lt;= number($show)">display:''</xsl:when>
          <xsl:otherwise>display:'none'</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
        <xsl:choose>
          <xsl:when test="Item and $header/Header[Data]">
            <td>
              <div style="width:12px">
                <a style="cursor:hand;text-decoration:none;">
                <xsl:attribute name="onclick">folder(c_<xsl:value-of select="$rowId"/>)</xsl:attribute>
                  <xsl:call-template name="image">
                    <xsl:with-param name="src" select="'open'"/>
                    <xsl:with-param name="alt" select="'close'"/>
                    <xsl:with-param name="id">e_c_<xsl:value-of select="$rowId"/></xsl:with-param>
                  </xsl:call-template>
                </a>
              </div>
            </td>
          </xsl:when>
          <xsl:when test="$header/Header[Data]"><td/></xsl:when>
        </xsl:choose>

        <xsl:apply-templates select="Data[not(@visible = 'false') and (@level &lt;= $Level or not(@level))]">
          <xsl:with-param name="header" select="$header"/>
        </xsl:apply-templates>
      </tr>

      <xsl:if test="$header/Header[Data]">
        <tr child="true" expandable="1" style="display:'none';">
        <xsl:attribute name="id">c_<xsl:value-of select="$rowId"/></xsl:attribute>
          <td colspan="100">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="10px"/>
                <td>
                  <xsl:choose>
                    <xsl:when test="$header/Header[1]/@style = 'info'">
                      <xsl:call-template name="infoTable">
                        <xsl:with-param name="header" select="$header/Header"/>
                        <xsl:with-param name="mode">child</xsl:with-param>
                      </xsl:call-template>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:call-template name="colTable">
                        <xsl:with-param name="header" select="$header/Header"/>
                        <xsl:with-param name="mode">child</xsl:with-param>
                      </xsl:call-template>
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </xsl:if>

    </xsl:for-each>
  </tbody>

  <xsl:if test="$header/Data[@summary]">
    <tfoot>
      <tr>
        <xsl:variable name="items" select="Item"/>

        <xsl:if test="$header/Header[Data]">
          <td width="1%"/>
        </xsl:if>

        <xsl:for-each select="$header[Data[@summary]]/Data[not(@visible='false')]">
          <td>
            <xsl:if test="@summary">
              <xsl:attribute name="style">border-top: 1px solid black;</xsl:attribute>
            </xsl:if>
            <xsl:if test="@span">
              <xsl:attribute name="colspan"><xsl:value-of select="@span"/></xsl:attribute>
            </xsl:if>
            <xsl:if test="@class">
              <xsl:attribute name="class"><xsl:value-of select="@class"/></xsl:attribute>
            </xsl:if>

              <xsl:variable name="format">
                <xsl:choose>
                  <xsl:when test="@format"><xsl:value-of select="@format"/></xsl:when>
                  <xsl:otherwise>0</xsl:otherwise>
                </xsl:choose>
              </xsl:variable>

              <xsl:if test="@summary">
                <xsl:choose>
                <xsl:when test="string-length(.)">
                  <xsl:value-of select="format-number(., $format)"/>
                </xsl:when>
                <xsl:when test="@summary='total'">
                  <xsl:value-of select="format-number(sum($items/Data[@name=current()/@name]), $format)"/>
                </xsl:when>
                <xsl:when test="@summary='average'">
                  <i><xsl:value-of select="format-number(sum($items/Data[@name=current()/@name]) div count($items/Data[@name=current()/@name]), $format)"/></i>
                </xsl:when>
                </xsl:choose>
              </xsl:if>

            </td>
          </xsl:for-each>
        </tr>
      </tfoot>
    </xsl:if>
 </table>
</xsl:template>

<!-- ********** TABLE TEMPLATE (INFO STYLE) ********** -->

<xsl:template name="infoTable">
<xsl:param name="Level"/>
<xsl:param name="tableId"/>
  <table class="block">
  <xsl:attribute name="id"><xsl:value-of select="$tableId"/></xsl:attribute>

    <xsl:for-each select="Item[(@level &lt;= $Level or not(@level))][Data[not(@visible='false') and (@level &lt;= $Level or not(@level))]]">
      <xsl:for-each select="Data[not(@visible='false')][(@level &lt;= $Level or not(@level))][not(@set)]">
        <tr>
          <td width="12%" class="h4" style="white-space:nowrap;" valign="top">
            <xsl:if test="not(@name=preceding-sibling::Data/@name)">
              <xsl:call-template name="label">
                <xsl:with-param name="label" select="@name"/>
              </xsl:call-template>
              <xsl:text>:</xsl:text>
            </xsl:if>
          </td>
          <td class="info" valign="center">
          <xsl:if test="position() mod 2=0">
            <xsl:attribute name="class">info b2</xsl:attribute>
          </xsl:if>
            <xsl:call-template name="data"/>
            <xsl:apply-templates select="@note|@warning"/>
          </td>
        </tr>
      </xsl:for-each>
      <xsl:if test="position() != last()">
        <tr><td colspan="3"><hr/></td></tr>
      </xsl:if>
    </xsl:for-each>
  </table>
</xsl:template>

<!-- ********** ITEM/DATA TEMPLATE ********** -->

<xsl:template match="Data">
<xsl:param name="header"/>

  <xsl:if test="not($header/Data[@name=current()/@name]/@visible = 'false')">
    <xsl:variable name="class">
      <xsl:choose>
        <xsl:when test="@class">
          <xsl:value-of select="@class"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$header/Data[@name=current()/@name]/@class"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <td>
    <xsl:if test="(position() != 1 and contains( $class, 'number'))">
      <xsl:attribute name="width">8%</xsl:attribute>
    </xsl:if>
    <xsl:if test="@span">
      <xsl:attribute name="colspan"><xsl:value-of select="@span"/></xsl:attribute>
    </xsl:if>
    <xsl:attribute name="class"><xsl:value-of select="$class"/></xsl:attribute>
      <xsl:value-of select="substring($tab, string-length($tab) - (@tab * 4))"/>
      <xsl:call-template name="data"/>
      <xsl:apply-templates select="@warning|@note"/>
    </td>
  </xsl:if>
</xsl:template>

<!-- ********** COLUMN HEADER TEMPLATE ********** -->

<xsl:template match="Data" mode="header">
<xsl:param name="sort"/>
<xsl:param name="tableId"/>
  <th class="header">
  <xsl:attribute name="colspan"><xsl:value-of select="@span"/></xsl:attribute>
  <xsl:attribute name="class">
    <xsl:choose>
      <xsl:when test="not(@class)"></xsl:when>
      <xsl:when test="@class='code' or @class='string'">string</xsl:when>
      <xsl:when test="@class='span'">span</xsl:when>
      <xsl:otherwise>number</xsl:otherwise>
    </xsl:choose>
  </xsl:attribute>
    <xsl:if test="$sort = 'true'">
      <xsl:attribute name="onclick">sort(<xsl:value-of select="$tableId"/>);</xsl:attribute>
      <xsl:attribute name="style">cursor:hand;</xsl:attribute>
    </xsl:if>
    <xsl:call-template name="title"/>
    <xsl:apply-templates select="@warning|@note"/>
  </th>
</xsl:template>

<!-- ********** DATA TEMPLATE ********** -->

<xsl:template name="data">
<xsl:param name="format"/>
<xsl:param name="noLink"/>
  <xsl:choose>
    <xsl:when test="@url">
      <a target="_BLANK">
      <xsl:attribute name="href"><xsl:value-of select="@url"/></xsl:attribute>
        <xsl:call-template name="dataValue">
          <xsl:with-param name="format" select="$format"/>
          <xsl:with-param name="noLink" select="$noLink"/>
        </xsl:call-template>
      </a>
    </xsl:when>
    <xsl:when test="@help">
      <a style="cursor:hand;text-decoration:underline;">
      <xsl:attribute name="onclick">showHelp('<xsl:value-of select="@help"/>')</xsl:attribute>
        <xsl:call-template name="dataValue">
          <xsl:with-param name="format" select="$format"/>
          <xsl:with-param name="noLink" select="$noLink"/>
        </xsl:call-template>
      </a>
    </xsl:when>
    <xsl:when test="@link">
      <a class="local">
      <xsl:attribute name="onclick">reveal('<xsl:value-of select="ms:idof(string(@link))"/>')</xsl:attribute>
      <xsl:attribute name="href">#<xsl:value-of select="ms:idof(string(@link))"/></xsl:attribute>
        <xsl:call-template name="dataValue">
          <xsl:with-param name="format" select="$format"/>
          <xsl:with-param name="noLink" select="$noLink"/>
        </xsl:call-template>
      </a>
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="dataValue">
        <xsl:with-param name="format" select="$format"/>
        <xsl:with-param name="noLink" select="$noLink"/>
      </xsl:call-template>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="dataValue">
<xsl:param name="format"/>
<xsl:param name="noLink"/>
  <xsl:apply-templates select="@img"/>
  <xsl:if test="not($noLink)">
    <xsl:for-each select="@anchor|@note|@warning">
      <a>
      <xsl:attribute name="name"><xsl:value-of select="ms:idof(string(.))"/></xsl:attribute>
      </a>
    </xsl:for-each>
  </xsl:if>
  <xsl:choose>
    <xsl:when test="@translate = 'value'">
      <xsl:call-template name="label">
        <xsl:with-param name="label" select="."/>
      </xsl:call-template>
    </xsl:when>
    <xsl:when test="string-length($format)">
      <xsl:value-of select="format-number(., $format)"/>
    </xsl:when>
    <xsl:when test="@format">
      <xsl:value-of select="format-number(., @format)"/>
    </xsl:when>
    <xsl:when test="ancestor::Table/Header/Data[@name=current()/@name]/@format">
      <xsl:value-of select="format-number(., ancestor::Table/Header/Data[@name=current()/@name]/@format)"/>
    </xsl:when>
    <xsl:otherwise><xsl:copy-of select="child::node()"/></xsl:otherwise>
  </xsl:choose>
  <xsl:if test="@units">
    <xsl:value-of select="' '"/>
    <xsl:call-template name="label">
      <xsl:with-param name="label" select="@units"/>
    </xsl:call-template>
  </xsl:if>
</xsl:template>

<!-- ********** LABEL TEMPLATE ********** -->

<xsl:template name="label">
<xsl:param name="label"/>

   <xsl:choose>
    <xsl:when test="@translate='false'">
      <xsl:value-of select="$label"/>
    </xsl:when>
    <xsl:otherwise>
      <xsl:variable name="title">
        <xsl:copy-of select="msxsl:node-set($titles)/String[@ID = $label][1]/child::node()"/>
      </xsl:variable>
      <xsl:choose>
        <xsl:when test="string-length($title)">
          <xsl:copy-of select="$title"/>
        </xsl:when>
        <xsl:otherwise>
         <xsl:value-of select="$label"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- ********** TITLE TEMPLATE ********** -->

<xsl:template name="title">
<xsl:param name="noUnit"/>

  <xsl:variable name="label">
    <xsl:choose>
      <xsl:when test="@label"><xsl:value-of select="@label"/></xsl:when>
      <xsl:otherwise><xsl:value-of select="@name"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:call-template name="label">
    <xsl:with-param name="label" select="$label"/>
  </xsl:call-template>

  <xsl:if test="not($noUnit) and @units">
    <xsl:value-of select="' '"/>
    <xsl:text>(</xsl:text>
    <xsl:call-template name="label">
      <xsl:with-param name="label" select="@units"/>
    </xsl:call-template>
    <xsl:text>)</xsl:text>
  </xsl:if>

  <xsl:if test="@index">
    <xsl:value-of select="' '"/>
    <xsl:value-of select="@index"/>
  </xsl:if>

</xsl:template>

<!-- ********** IMAGE TEMPLATE ********** -->

<xsl:template name="image">
<xsl:param name="src"/>
<xsl:param name="alt"/>
<xsl:param name="id"/>

  <xsl:variable name="srcImage">
    <xsl:choose>
      <xsl:when test="msxsl:node-set($images)/Image[@ID=$src]">
        <xsl:copy-of select="msxsl:node-set($images)/Image[@ID=$src][1]/child::node()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$src"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="altImage">
    <xsl:choose>
      <xsl:when test="msxsl:node-set($images)/Image[@ID=$alt]">
        <xsl:copy-of select="msxsl:node-set($images)/Image[@ID=$alt][1]/child::node()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$alt"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:choose>
    <xsl:when test="$Portable">
      <div style="float:left;width:0;letter-spacing:0;">
      <xsl:if test="$id">
        <xsl:attribute name="id"><xsl:copy-of select="$id"/></xsl:attribute>
      </xsl:if>
        <xsl:copy-of select="$srcImage"/>
      </div>
      <xsl:if test="$alt and $id">
        <div style="display:'none'">
        <xsl:attribute name="id">alt_<xsl:value-of select="$id"/></xsl:attribute>
          <xsl:copy-of select="$altImage"/>
        </div>
      </xsl:if>
    </xsl:when>
    <xsl:otherwise>
      <div style="float:left">
        <img border="0" style="margin-right: 5px">
        <xsl:if xmlns:xsl="http://www.w3.org/1999/XSL/Transform" test="$alt">
          <xsl:attribute name="altImage"><xsl:copy-of select="$altImage"/></xsl:attribute>
        </xsl:if>
        <xsl:if xmlns:xsl="http://www.w3.org/1999/XSL/Transform" test="$id">
          <xsl:attribute name="id"><xsl:copy-of select="$id"/></xsl:attribute>
        </xsl:if>
        <xsl:attribute xmlns:xsl="http://www.w3.org/1999/XSL/Transform" name="src"><xsl:copy-of select="$srcImage"/></xsl:attribute>
        </img>
      </div>
    </xsl:otherwise>
  </xsl:choose>

</xsl:template>

<xsl:template match="@img">
  <xsl:call-template name="image">
    <xsl:with-param name="src" select="."/>
  </xsl:call-template>
</xsl:template>

<!-- ********** NOTE POPUP TEMPLATE ********** -->

<xsl:template match="@note|@warning">
  <xsl:variable name="id">popup_<xsl:value-of select="ms:tag()"/></xsl:variable>
  <a style="cursor:help">
  <xsl:attribute name="onMouseOver">popup(<xsl:value-of select="$id"/>)</xsl:attribute>
  <xsl:attribute name="onMouseOut"><xsl:value-of select="$id"/>.style.display='none'</xsl:attribute>
    <div style="position:absolute;">
      <div style="position:absolute;top:-2px;left:3;">
        <xsl:call-template name="image">
          <xsl:with-param name="src">
            <xsl:choose>
              <xsl:when test="name()='note'">note</xsl:when>
              <xsl:otherwise>flag</xsl:otherwise>
            </xsl:choose>
          </xsl:with-param>
        </xsl:call-template>
      </div>
    </div>
    <xsl:value-of select="'   '"/>
  </a>
  <div class="popup" style="display:'none';width:300;">
  <xsl:variable name="value" select="."/>
  <xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
    <xsl:choose>
      <xsl:when test="//Data/@message = .">
        <xsl:for-each select="//Data[@message = $value]">
        <xsl:sort select="not(@key) or @key &lt; 0" data-type="number"/>
          <xsl:call-template name="dataValue"/><br/>
          <xsl:if test="position()!=last()"><hr/></xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="label">
          <xsl:with-param name="label" select="$value"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>

  </div>
</xsl:template>

</xsl:stylesheet>
