<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:key name="db" match="/DJ_PLAYLISTS/COLLECTION/TRACK" use="@TrackID"/>

<xsl:template match="/">
  <html>
  <body>
    <h2>Track Collection</h2>
    <xsl:apply-templates select="DJ_PLAYLISTS/COLLECTION" />

    <h2>Playlists</h2>
    <xsl:apply-templates select="DJ_PLAYLISTS/PLAYLISTS" />
  </body>
  </html>
</xsl:template>

<xsl:template match="TRACK">
  <xsl:variable name="key" select="@Key"></xsl:variable>
    <xsl:variable name="dbitem" select="key('db', @Key)"></xsl:variable>
    <tr>
      <td><xsl:value-of select="position()"/></td>
      <td><xsl:value-of select="$dbitem/@TrackID"/></td>
      <td><xsl:value-of select="$dbitem/@Name"/> by <xsl:value-of select="$dbitem/@Artist"/></td>
    </tr>
</xsl:template>

<xsl:template match="NODE/NODE[@Type=1]">
  <h2>Playlist Found: <xsl:value-of select="@Name"/></h2>
  
  <table border="1">
    <tr bgcolor="#9acd32">
      <th>Index</th>
      <th>TrackID</th>
      <th>Name</th>
    </tr>
    <xsl:apply-templates select="TRACK" />
  </table>
</xsl:template>

<xsl:template match="COLLECTION">
  <table border="1">
    <tr bgcolor="#9acd32">
      <th>TrackID</th>
      <th>Name</th>
    </tr>
    <xsl:for-each select="TRACK">
    <tr>
      <td><xsl:value-of select="@TrackID"/></td>
      <td><xsl:value-of select="@Name"/></td>
    </tr>
    </xsl:for-each>
  </table>
</xsl:template>


</xsl:stylesheet>